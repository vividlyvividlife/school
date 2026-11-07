"""Build the clock dictation banks with VoxCPM2 through VoiceStudio's local API.

Run with the venv that has faster-whisper, soundfile and lameenc:
    .tts/Scripts/python.exe scripts/make-dictation-audio-voxcpm2.py [step] [options]

Phases (all by default):
    gen    POST /generate per text, trim + pad + fade, cache one WAV per clip
    check  ASR round-trip over the cache; re-pick seeds for clips whose words are lost
    pack   concatenate the cache into a sprite mp3 + timing json + preview wav

Writes to public/audio/dictation:
    vox-f-clock.{mp3,json}   female teacher voice
    vox-m-clock.{mp3,json}   male teacher voice

The engine endpoint trims its own output at the detected end of speech, which
cuts final syllables, so every clip gets a silence pad and a fade here instead.
Russian has no text normaliser in this engine, so texts must already be spelled
out (see scripts/clock_text.py).
"""

import argparse
import glob
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import wave

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, resample_poly

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from clock_text import bank_texts  # noqa: E402
from dictation_text import ru_number  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "http://127.0.0.1:3900"
OUT_DIR = os.path.join(ROOT, "public", "audio", "dictation")
WORK_DIR = os.path.join(ROOT, ".vox", "clock")
SR = 24000
BITRATE = 32
LEAD = 0.05
TAIL = 0.10
FADE = 0.012
TRIM_THRESHOLD = 0.01
TRIM_PAD = 0.03
TRIM_TAIL = 0.12
GAP = 0.08
SPEED = "0.85"
SEED_BASE = 1000
RETRIES = 3

VOICES = {"f": ("vox-f", "ref-xenia.wav"), "m": ("vox-m", "ref-aidar.wav")}
REFS_DIR = os.path.join(ROOT, ".f5", "refs")
# Must be the words actually spoken in the reference wav, otherwise the cloned
# speaker inherits a mismatched prosody.
REF_TEXT = "Сегодня мы решим несколько примеров. Сначала сложение, потом вычитание."

SNAP = glob.glob(os.path.join(
    os.environ.get("LOCALAPPDATA", ""), "OmniVoice", "hf_cache",
    "models--deepdml--faster-whisper-large-v3-turbo-ct2", "snapshots", "*"))


def ref_bytes(name):
    path = os.path.join(REFS_DIR, name)
    with open(path, "rb") as f:
        return f.read()


def post(fields, files=None, timeout=1800):
    bound = "----q" + uuid.uuid4().hex
    body = b""
    for k, v in fields.items():
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n'
                 % (bound, k, v)).encode()
    for k, (name, data) in (files or {}).items():
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"; filename="%s"\r\n'
                 'Content-Type: audio/wav\r\n\r\n' % (bound, k, name)).encode() + data + b"\r\n"
    body += ("--%s--\r\n" % bound).encode()
    req = urllib.request.Request(BASE + "/generate", data=body,
                                 headers={"Content-Type": "multipart/form-data; boundary=" + bound})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.status


def trim_pad_fade(audio):
    idx = np.where(np.abs(audio) > TRIM_THRESHOLD)[0]
    if not len(idx):
        return audio
    start = max(0, idx[0] - int(TRIM_PAD * SR))
    end = min(len(audio), idx[-1] + int(TRIM_TAIL * SR))
    seg = audio[start:end].astype(np.float32)
    peak = float(np.max(np.abs(seg)))
    if peak > 0:
        seg = seg / peak * 0.9
    seg = np.concatenate([np.zeros(int(LEAD * SR), np.float32), seg,
                          np.zeros(int(TAIL * SR), np.float32)])
    f = int(FADE * SR)
    seg[:f] *= np.linspace(0, 1, f, dtype=np.float32)
    seg[-f:] *= np.linspace(1, 0, f, dtype=np.float32)
    return seg


def write_wav(path, pcm):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(pcm, -1, 1) * 32767).astype(np.int16).tobytes())


def read_wav(path):
    y, sr = sf.read(path, dtype="float32")
    return np.asarray(y).reshape(len(y), -1)[:, 0]


def synth(code, text, seed):
    for attempt in range(3):
        try:
            raw, status = post({"text": text, "language": "ru", "seed": str(seed),
                                "speed": SPEED, "ref_text": REF_TEXT},
                               files={"ref_audio": (VOICES[code][1], ref_bytes(VOICES[code][1]))})
            if raw[:4] == b"RIFF":
                break
        except OSError as exc:
            raw, status = repr(exc)[:200], "error"
        time.sleep(3 * (attempt + 1))
    else:
        raise RuntimeError("engine returned %s (HTTP %s): %s"
                           % (raw[:120], status, text[:60]))
    with wave.open(__import__("io").BytesIO(raw), "rb") as f:
        src_sr = f.getframerate()
        pcm = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    if src_sr != SR:
        pcm = resample_poly(pcm, SR, src_sr)
    return trim_pad_fade(np.asarray(pcm, dtype=np.float32).reshape(-1))


def clip_path(code, key):
    return os.path.join(WORK_DIR, code, "%s.wav" % key)


def gen_phase(texts, codes, regen=False):
    for code in codes:
        todo = [(k, t) for k, t in texts.items()
                if regen or not os.path.isfile(clip_path(code, k))]
        print("%s: %d clips to generate" % (code, len(todo)), flush=True)
        started = time.time()
        for i, (key, text) in enumerate(todo):
            seg = synth(code, text, SEED_BASE + i)
            write_wav(clip_path(code, key), seg)
            if (i + 1) % 10 == 0 or i + 1 == len(todo):
                print("  %s %d/%d in %.0fs" % (code, i + 1, len(todo),
                                               time.time() - started), flush=True)


def norm(s):
    s = re.sub(r"\d+", lambda m: ru_number(int(m.group())), s.lower().replace("ё", "е"))
    s = "".join(c for c in s if c.isalpha() or c.isspace())
    return " ".join(s.split())


def distance(ref, hyp):
    r = norm(ref).split()
    h = norm(hyp).split()
    d = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        d[i][0] = i
    for j in range(len(h) + 1):
        d[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1,
                          d[i - 1][j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(r)][len(h)], len(r)


def check_phase(texts, codes):
    """Keep every clip, but re-pick a seed whenever ASR loses or changes a word."""
    if not SNAP:
        print("no whisper weights; skipping ASR gate", flush=True)
        return {}
    from faster_whisper import WhisperModel
    model = WhisperModel(SNAP[0], device="cpu", compute_type="int8", cpu_threads=6)
    report = {}
    for code in codes:
        bad = []
        for i, (key, text) in enumerate(texts.items()):
            path = clip_path(code, key)
            if not os.path.isfile(path):
                bad.append((key, text, 99))
                continue
            y = read_wav(path)
            segs, _ = model.transcribe(resample_poly(y, 16000, SR).astype(np.float32),
                                       language="ru", beam_size=5,
                                       condition_on_previous_text=False)
            hyp = " ".join(s.text.strip() for s in segs).strip()
            err, n = distance(text, hyp)
            if err:
                bad.append((key, text, err))
            if (i + 1) % 25 == 0:
                print("  check %s %d/%d, %d flagged" % (code, i + 1, len(texts), len(bad)),
                      flush=True)
        print("%s: %d/%d clips flagged by ASR" % (code, len(bad), len(texts)), flush=True)
        for attempt in range(1, RETRIES + 1):
            if not bad:
                break
            still = []
            for key, text, err in bad:
                seg = synth(code, text,
                            SEED_BASE + attempt * 7000 + sum(map(ord, key)) % 997)
                y = seg
                segs, _ = model.transcribe(resample_poly(y, 16000, SR).astype(np.float32),
                                           language="ru", beam_size=5,
                                           condition_on_previous_text=False)
                hyp = " ".join(s.text.strip() for s in segs).strip()
                new_err, n = distance(text, hyp)
                if new_err == 0:
                    write_wav(clip_path(code, key), seg)
                    print("  fixed %s (take %d)" % (key, attempt), flush=True)
                elif new_err < err:
                    write_wav(clip_path(code, key), seg)
                    print("  better %s: %d -> %d (take %d)" % (key, err, new_err, attempt),
                          flush=True)
                    still.append((key, text, new_err))
                else:
                    still.append((key, text, err))
            bad = still
        report[code] = [{"key": k, "text": t, "words_wrong": e} for k, t, e in bad]
        if bad:
            print("%s: still imperfect: %s" % (code, [b["key"] for b in report[code]]), flush=True)
    return report


def encode_mp3(pcm):
    pcm16 = (np.clip(pcm, -1, 1) * 32767).astype(np.int16)
    enc = __import__("lameenc").Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(SR)
    # Without an explicit output rate LAME silently resamples to 22.05 kHz.
    enc.set_out_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm16.tobytes()) + enc.flush()


def decoder_lag(path, pcm, seconds=6.0):
    y, sr = sf.read(path, dtype="float32")
    y = np.asarray(y).reshape(len(y), -1)[:, 0]
    n = min(len(y), len(pcm), int(seconds * sr))
    a = y[:n].astype(np.float64)
    b = pcm[:n].astype(np.float64)
    a -= a.mean()
    b -= b.mean()
    lag = int(np.argmax(fftconvolve(a, b[::-1]))) - (n - 1)
    return lag / sr


def pack_phase(texts, codes):
    os.makedirs(OUT_DIR, exist_ok=True)
    keys = list(texts)
    for code in codes:
        base, _ = VOICES[code]
        parts, clips, cursor = [], {}, 0
        missing = [k for k in keys if not os.path.isfile(clip_path(code, k))]
        if missing:
            raise SystemExit("missing clips for %s: %s" % (code, missing[:10]))
        for key in keys:
            seg = read_wav(clip_path(code, key))
            clips[key] = [round(cursor / SR, 4), round(len(seg) / SR, 4)]
            parts.append(seg)
            cursor += len(seg)
        pcm = np.concatenate(parts)
        name = "%s-clock" % base
        path = os.path.join(OUT_DIR, name + ".mp3")
        with open(path, "wb") as f:
            f.write(encode_mp3(pcm))
        shift = decoder_lag(path, pcm)
        for key in clips:
            clips[key][0] = round(clips[key][0] + shift, 4)
        meta = {"version": 1, "voice": base, "sampleRate": SR, "gap": GAP, "clips": clips}
        with open(os.path.join(OUT_DIR, name + ".json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
        write_wav(os.path.join(WORK_DIR, name + "-preview.wav"), pcm)
        print("%s: %d clips, mp3 %.2f MB, %.0f s, lag %.1f ms"
              % (name, len(keys), os.path.getsize(path) / 1048576, len(pcm) / SR,
                 shift * 1000), flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("step", nargs="?", type=int, default=5, choices=[30, 5, 1])
    ap.add_argument("--voices", default="f,m")
    ap.add_argument("--phase", default="all", choices=["all", "gen", "check", "pack"])
    ap.add_argument("--regen", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="only the first N keys (smoke test)")
    args = ap.parse_args()

    codes = [c.strip() for c in args.voices.split(",") if c.strip()]
    for c in codes:
        if c not in VOICES:
            raise SystemExit("unknown voice %r" % c)
    texts = bank_texts(step=args.step)
    if args.limit:
        texts = dict(list(texts.items())[:args.limit])
    os.makedirs(WORK_DIR, exist_ok=True)
    print("step %d: %d clips, voices %s" % (args.step, len(texts), codes), flush=True)

    if args.phase in ("all", "gen"):
        gen_phase(texts, codes, args.regen)
    report = {}
    if args.phase in ("all", "check"):
        report = check_phase(texts, codes)
        with open(os.path.join(WORK_DIR, "asr-report-step%d.json" % args.step), "w",
                  encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=1)
    if args.phase in ("all", "pack"):
        pack_phase(texts, codes)


if __name__ == "__main__":
    main()
