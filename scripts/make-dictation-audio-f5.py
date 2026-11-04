"""Build the math dictation banks with F5-TTS_RUSSIAN v2 (GPU, 24 kHz).

Run with the F5 venv:
    .f5/Scripts/python.exe scripts/make-dictation-audio-f5.py [light|full|all] [--reuse]

Writes four banks to public/audio/dictation:
    f5-xenia.{mp3,json}        light, female (xenia reference)
    f5-aidar.{mp3,json}        light, male (aidar reference)
    f5-xenia-full.{mp3,json}   full dictation, female
    f5-aidar-full.{mp3,json}   full dictation, male

Stress is marked automatically with RUAccent ("+" before the stressed vowel).
F5 estimates clip duration from the reference speech rate; the fast references
made short clips collapse or cut the last syllable, so the duration is passed
explicitly (>=1 s, ~0.11 s per character) and silence is trimmed afterwards.
"""

import argparse
import json
import os
import sys
import time
import wave

import numpy as np
import soundfile as sf
import torch
import torchaudio
from scipy.signal import fftconvolve


def _sf_load(path, **kwargs):
    data, sr = sf.read(path, dtype="float32", always_2d=True)
    return torch.from_numpy(data.T.copy()), sr


torchaudio.load = _sf_load

import lameenc  # noqa: E402

from f5_tts.api import F5TTS  # noqa: E402
from f5_tts.infer.utils_infer import preprocess_ref_audio_text  # noqa: E402
from ruaccent import RUAccent  # noqa: E402

from dictation_text import FULL_PHRASES, ru_number, ru_number_genitive  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(ROOT, ".f5", "model")
CKPT = os.path.join(MODEL_DIR, "model_last_inference.safetensors")
VOCAB = os.path.join(MODEL_DIR, "vocab.txt")
REF_TEXT = "Сегодня мы решим несколько примеров. Сначала сложение, потом вычитание."
OUT_DIR = os.path.join(ROOT, "public", "audio", "dictation")
WORK_DIR = os.path.join(ROOT, ".f5", "out", "build")
SR = 24000
BITRATE = 32
LEAD = 0.04
TAIL = 0.02
TRIM_THRESHOLD = 0.01
TRIM_PAD = 0.02
TRIM_TAIL = 0.08
SEC_PER_CHAR = 0.11
MIN_GEN_SEC = 1.0

VOICES = [("f", "xenia", "f5-xenia"), ("m", "aidar", "f5-aidar")]

OPS = [("o_add", "плюс,"), ("o_sub", "минус,"),
       ("o_mul", "умножить на,"), ("o_div", "разделить на,")]

PREVIEWS = {
    "light": [
        ["c54", "o_add", "n8"], ["c63", "o_sub", "n28"], ["c7", "o_mul", "n8"],
        ["c81", "o_div", "n9"], ["c100", "o_sub", "n47"], ["c12", "o_add", "n9"],
        ["c95", "o_sub", "n7"],
    ],
    "full": [
        ["p_minuend", "m63", "p_subtrahend", "m28", "p_diff_short"],
        ["p_sum_find", "m54", "i27"],
        ["p_factor1", "m7", "p_factor2", "m8", "p_prod_short"],
        ["p_dividend", "m81", "p_divisor", "m9", "p_quot_short"],
        ["p_howmuch", "m54", "p_more", "g27"],
        ["p_howmuch", "m27", "p_less", "g54"],
        ["p_howmany", "m56", "p_more", "g7"],
    ],
}


def light_keys():
    texts = {}
    for n in range(101):
        texts["c%d" % n] = ru_number(n) + ","
        texts["n%d" % n] = ru_number(n) + "."
    for key, text in OPS:
        texts[key] = text
    return texts


def full_keys():
    texts = dict(FULL_PHRASES)
    for n in range(101):
        texts["m%d" % n] = ru_number(n) + ","
        texts["i%d" % n] = "и " + ru_number(n) + "."
        texts["g%d" % n] = ru_number_genitive(n) + "?"
    return texts


def trim(audio):
    idx = np.where(np.abs(audio) > TRIM_THRESHOLD)[0]
    if not len(idx):
        return audio
    start = max(0, idx[0] - int(TRIM_PAD * SR))
    end = min(len(audio), idx[-1] + int(TRIM_TAIL * SR))
    seg = audio[start:end].astype(np.float32)
    peak = float(np.max(np.abs(seg)))
    if peak > 0:
        seg = seg / peak * 0.9
    fade = min(int(0.005 * SR), len(seg) // 2)
    if fade:
        seg[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        seg[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return seg


def write_wav(path, pcm):
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(pcm, -1, 1) * 32767).astype(np.int16).tobytes())


def encode_mp3(pcm):
    pcm16 = (np.clip(pcm, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(SR)
    # Without an explicit output rate LAME silently resamples to 22.05 kHz.
    enc.set_out_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm16.tobytes()) + enc.flush()


def decoder_lag(path, pcm, seconds=6.0):
    """Delay, in seconds, that decoders add before the encoded PCM.

    The MP3s carry no gapless metadata, so both WebAudio and libsndfile emit
    the codec delay up front; without compensation every clip window starts
    ~50 ms late and ends ~50 ms early (cut tail, previous clip bleeding in).
    """
    y, sr = sf.read(path, dtype="float32", always_2d=True)
    n = min(len(y), len(pcm), int(seconds * sr))
    a = y[:n, 0].astype(np.float64)
    b = pcm[:n].astype(np.float64)
    a -= a.mean()
    b -= b.mean()
    lag = int(np.argmax(fftconvolve(a, b[::-1]))) - (n - 1)
    return lag / sr


def read_disk(name, key, code):
    if key.startswith("m"):
        name, key = "light", "c" + key[1:]
    path = os.path.join(WORK_DIR, code, "%s-%s.wav" % (name, key))
    if not os.path.isfile(path):
        return None
    audio = sf.read(path, dtype="float32")[0]
    return np.asarray(audio, dtype=np.float32).reshape(-1)


def build(f5, acc, refs, name, texts, gap, cache, reuse):
    keys = list(texts)
    clips = {code: {} for code, _, _ in VOICES}
    parts = {code: [] for code, _, _ in VOICES}
    cursor = {code: 0 for code in clips}
    lead = {code: np.zeros(int(LEAD * SR), dtype=np.float32) for code in clips}
    tail = {code: np.zeros(int(TAIL * SR), dtype=np.float32) for code in clips}
    started = time.time()

    for i, key in enumerate(keys):
        text = texts[key]
        for code, voice, _ in VOICES:
            cache_key = (code, text)
            if cache_key not in cache:
                seg = read_disk(name, key, code) if reuse else None
                if seg is None:
                    marked = acc.process_all(text)
                    nchars = len(marked.replace("+", ""))
                    gen_sec = max(MIN_GEN_SEC, SEC_PER_CHAR * nchars)
                    wav, sr, _ = f5.infer(
                        refs[code], REF_TEXT, marked, seed=1, nfe_step=32,
                        fix_duration=refs[code + "_sec"] + gen_sec,
                        show_info=lambda *a, **k: None)
                    seg = trim(np.asarray(wav, dtype=np.float32).reshape(-1))
                    voice_dir = os.path.join(WORK_DIR, code)
                    os.makedirs(voice_dir, exist_ok=True)
                    sf.write(os.path.join(voice_dir, "%s-%s.wav" % (name, key)), seg, SR)
                cache[cache_key] = seg
            piece = np.concatenate([lead[code], cache[cache_key], tail[code]])
            clips[code][key] = [round(cursor[code] / SR, 4), round(len(piece) / SR, 4)]
            parts[code].append(piece)
            cursor[code] += len(piece)
        if (i + 1) % 10 == 0 or i + 1 == len(keys):
            print("%s: %d/%d in %.0fs" % (name, i + 1, len(keys), time.time() - started), flush=True)

    for code, _, base in VOICES:
        pcm = np.concatenate(parts[code])
        suffix = "" if name == "light" else "-" + name
        filename = base + suffix
        path = os.path.join(OUT_DIR, filename + ".mp3")
        with open(path, "wb") as f:
            f.write(encode_mp3(pcm))

        shift = decoder_lag(path, pcm)
        for key in clips[code]:
            clips[code][key][0] = round(clips[code][key][0] + shift, 4)

        meta = {
            "version": 1,
            "voice": base,
            "sampleRate": SR,
            "gap": gap,
            "clips": clips[code],
        }
        with open(os.path.join(OUT_DIR, filename + ".json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

        print("%s: mp3 %.2f MB, %.1f s, lag %.1f ms"
              % (filename, os.path.getsize(path) / 1048576, len(pcm) / SR, shift * 1000),
              flush=True)

        gap_pcm = np.zeros(int(gap * SR), dtype=np.float32)
        sentence_gap = np.zeros(int(0.45 * SR), dtype=np.float32)
        preview = []
        for seq in PREVIEWS[name]:
            for j, clip_key in enumerate(seq):
                preview.append(parts[code][keys.index(clip_key)])
                if j + 1 < len(seq):
                    preview.append(gap_pcm)
            preview.append(sentence_gap)
        write_wav(os.path.join(WORK_DIR, filename + "-preview.wav"), np.concatenate(preview))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("which", nargs="?", default="all", choices=["light", "full", "all"])
    parser.add_argument("--reuse", action="store_true",
                        help="reuse per-clip WAVs already in .f5/out/build")
    args = parser.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(WORK_DIR, exist_ok=True)

    t0 = time.time()
    f5 = F5TTS(model="F5TTS_v1_Base", ckpt_file=CKPT, vocab_file=VOCAB, device="cuda")
    acc = RUAccent()
    acc.load(omograph_model_size="turbo2", use_dictionary=True)

    refs = {}
    for code, voice, _ in VOICES:
        path = os.path.join(ROOT, ".f5", "refs", "ref-%s.wav" % voice)
        processed, _ = preprocess_ref_audio_text(path, REF_TEXT, show_info=lambda *a, **k: None)
        refs[code] = path
        refs[code + "_sec"] = sf.info(processed).duration
        print("ref %s: %.2fs" % (voice, refs[code + "_sec"]), flush=True)
    print("loaded in %.1fs" % (time.time() - t0), flush=True)

    cache = {}
    if args.which in ("light", "all"):
        build(f5, acc, refs, "light", light_keys(), 0.03, cache, args.reuse)
    if args.which in ("full", "all"):
        build(f5, acc, refs, "full", full_keys(), 0.08, cache, args.reuse)


if __name__ == "__main__":
    main()
