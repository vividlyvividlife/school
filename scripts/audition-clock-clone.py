"""Clone a fixed reference speaker in VoxCPM2 and measure whether the voice stays put.

Run with the VoiceStudio-capable venv (only needs stdlib + numpy + soundfile):
    .tts/Scripts/python.exe scripts/audition-clock-clone.py

The bank built with `instruct` voice design drifted between male and female
speakers from clip to clip, so this tries the other Apache-licensed route:
reference-audio cloning through /generate's ref_audio + ref_text.
Prints per-clip f0 and writes an A/B wav for the ear check.
"""

import io
import os
import sys
import uuid
import wave

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from clock_text import bank_texts  # noqa: E402

BASE = "http://127.0.0.1:3900"
OUT = os.path.join(ROOT, ".vox", "clock-clone")
SR = 24000
SPEED = "0.85"
REF_TEXT = "Сегодня мы решим несколько примеров. Сначала сложение, потом вычитание."
VOICES = {"f": "ref-xenia.wav", "m": "ref-aidar.wav"}
KEYS = ["p_read", "p_show", "t_7_20", "t_3_0", "t_1_5", "d_plus_1",
        "d_plus_10", "d_minus_30", "d_fast_5", "d_slow_10", "d_lesson_end_25", "h_plus_2"]


def post(fields, files=None, timeout=1800):
    bound = "----q" + uuid.uuid4().hex
    body = b""
    for k, v in fields.items():
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n'
                 % (bound, k, v)).encode()
    for k, (name, data) in (files or {}).items():
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"; filename="%s"\r\n'
                 'Content-Type: audio/wav\r\n\r\n' % (bound, k, name)).encode()
        body += data + b"\r\n"
    body += ("--%s--\r\n" % bound).encode()
    import urllib.request
    req = urllib.request.Request(BASE + "/generate", data=body,
                                 headers={"Content-Type": "multipart/form-data; boundary=" + bound})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.status


def read_wav(raw):
    with wave.open(io.BytesIO(raw), "rb") as f:
        sr, ch = f.getframerate(), f.getnchannels()
        y = np.frombuffer(f.readframes(f.getnframes()), dtype="<i2")
    y = y.reshape(-1, ch)[:, 0].astype(np.float32) / 32768.0
    if sr != SR:
        y = resample_poly(y, SR, sr).astype(np.float32)
    return y


def f0(y):
    """Shortest lag reaching 60% of the best autocorrelation peak: octave-safe."""
    x = y - float(np.mean(y))
    e = float(np.dot(x, x))
    if e < 1e-6:
        return 0.0
    ac = np.correlate(x, x, "full")[len(x) - 1:] / e
    lo, hi = int(SR / 400), int(SR / 70)
    best = float(np.max(ac[lo:hi]))
    for lag in range(lo, hi):
        if ac[lag] >= 0.6 * best:
            return SR / lag
    return 0.0


def main():
    os.makedirs(OUT, exist_ok=True)
    texts = bank_texts(5)
    missing = [k for k in KEYS if k not in texts]
    if missing:
        raise SystemExit("no such clock keys: %s" % missing)
    for code, ref in VOICES.items():
        ref_bytes = open(os.path.join(ROOT, ".f5", "refs", ref), "rb").read()
        row = []
        for key in KEYS:
            raw, status = post({"text": texts[key], "language": "ru", "seed": "7001",
                                "speed": SPEED, "ref_text": REF_TEXT},
                               files={"ref_audio": (ref, ref_bytes)})
            if raw[:4] != b"RIFF":
                raise SystemExit("HTTP %s -> %s" % (status, raw[:200]))
            y = read_wav(raw)
            out = os.path.join(OUT, "%s-%s.wav" % (code, key))
            sf.write(out, y, SR)
            row.append((key, len(y) / SR, f0(y[:int(2.0 * SR)])))
            print("%s %-14s %.2fs  %5.0f Hz  %s"
                  % (code, row[-1][0], row[-1][1], row[-1][2],
                     texts[key].encode("unicode_escape").decode()[:70]), flush=True)
        vals = np.array([r[2] for r in row if r[2] > 0])
        print("%s: median %.0f Hz, range %.0f-%.0f, below 150 Hz: %d/%d"
              % (code, np.median(vals), vals.min(), vals.max(),
                 int((vals < 150).sum()), len(vals)), flush=True)
        with wave.open(os.path.join(OUT, "%s-all.wav" % code), "wb") as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(SR)
            gap = np.zeros(int(0.25 * SR), np.float32)
            seq = []
            for key, _, _ in row:
                y, _ = sf.read(os.path.join(OUT, "%s-%s.wav" % (code, key)), dtype="float32")
                seq.extend([y, gap])
            f.writeframes((np.clip(np.concatenate(seq), -1, 1) * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    main()
