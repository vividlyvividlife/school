"""Build the voice bank for the math dictation trainer.

Run with the local TTS venv:
    .tts/Scripts/python.exe scripts/make-dictation-audio.py

The script needs Silero v5 (ru, baya), numpy and lameenc in .tts.
It writes public/audio/dictation/ru-v5-baya.{mp3,json} and a preview
to .tts/out/bank_preview.wav.
"""

import json
import os
import wave

import lameenc
import numpy as np
import torch
from silero import silero_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "audio", "dictation")
PREVIEW_DIR = os.path.join(ROOT, ".tts", "out")
SR = 24000
BITRATE = 32
LEAD = 0.05
TAIL = 0.02
TRIM_THRESHOLD = 0.008
TRIM_PAD = 0.025

ONES = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
         "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят",
        "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
OPS = [("add", "плюс"), ("sub", "минус"), ("mul", "умножить на"), ("div", "разделить на")]


def ru_number(n):
    if n < 10:
        return ONES[n]
    if n < 20:
        return TEENS[n - 10]
    if n == 100:
        return "сто"
    tens, ones = divmod(n, 10)
    return TENS[tens] + (" " + ONES[ones] if ones else "")


def clip_texts():
    texts = {}
    for n in range(101):
        texts["n%d" % n] = ru_number(n) + "."
        for key, word in OPS:
            texts["%s%d" % (key, n)] = ru_number(n) + " " + word
    return texts


def trim(audio):
    idx = np.where(np.abs(audio) > TRIM_THRESHOLD)[0]
    if not len(idx):
        return audio
    start = max(0, idx[0] - int(TRIM_PAD * SR))
    end = min(len(audio), idx[-1] + int(TRIM_PAD * SR))
    seg = audio[start:end].astype(np.float32)
    peak = float(np.max(np.abs(seg)))
    if peak > 0:
        seg = seg / peak * 0.9
    return seg


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)

    model, _ = silero_tts(language="ru", speaker="v5_ru")
    model.to(torch.device("cpu"))

    texts = clip_texts()
    keys = list(texts)
    clips = {}
    pcm_parts = []
    cursor = 0
    lead = np.zeros(int(LEAD * SR), dtype=np.float32)
    tail = np.zeros(int(TAIL * SR), dtype=np.float32)

    for i, key in enumerate(keys):
        audio = model.apply_tts(text=texts[key], speaker="baya", sample_rate=SR).numpy()
        seg = trim(audio)
        piece = np.concatenate([lead, seg, tail])
        start = cursor / SR
        dur = len(piece) / SR
        clips[key] = [round(start, 4), round(dur, 4)]
        pcm_parts.append(piece)
        cursor += len(piece)
        if (i + 1) % 25 == 0 or i + 1 == len(keys):
            print("generated %d/%d" % (i + 1, len(keys)), flush=True)

    pcm = np.concatenate(pcm_parts)
    pcm16 = (np.clip(pcm, -1, 1) * 32767).astype(np.int16)

    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    mp3 = enc.encode(pcm16.tobytes()) + enc.flush()

    mp3_path = os.path.join(OUT_DIR, "ru-v5-baya.mp3")
    with open(mp3_path, "wb") as f:
        f.write(mp3)

    meta = {
        "version": 1,
        "voice": "v5-baya",
        "sampleRate": SR,
        "gap": 0.06,
        "clips": clips,
    }
    with open(os.path.join(OUT_DIR, "ru-v5-baya.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    print("mp3: %.2f MB, %.1f s" % (len(mp3) / 1048576, len(pcm) / SR))

    preview = [("add", 54, 27), ("sub", 63, 28), ("mul", 7, 8),
               ("div", 81, 9), ("sub", 100, 47), ("add", 12, 9), ("sub", 95, 7)]
    gap = np.zeros(int(0.06 * SR), dtype=np.float32)
    parts = []
    for op, a, b in preview:
        head = pcm_parts[keys.index("%s%d" % (op, a))]
        tail_clip = pcm_parts[keys.index("n%d" % b)]
        parts.extend([head, gap, tail_clip, np.zeros(int(0.45 * SR), dtype=np.float32)])
    preview_pcm = np.concatenate(parts)
    preview_path = os.path.join(PREVIEW_DIR, "bank_preview.wav")
    with wave.open(preview_path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(preview_pcm, -1, 1) * 32767).astype(np.int16).tobytes())
    print("preview:", preview_path)


if __name__ == "__main__":
    main()
