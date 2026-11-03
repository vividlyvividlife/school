"""Build the voice banks for the math dictation trainer.

Run with the local TTS venv:
    .tts/Scripts/python.exe scripts/make-dictation-audio.py [light|full|all]

The script needs Silero v5 (ru, baya), numpy and lameenc in .tts.
It writes public/audio/dictation/ru-v5-baya.{mp3,json} for the light
dictation, public/audio/dictation/ru-v5-baya-full.{mp3,json} for the
full math dictation, and previews to .tts/out/.
"""

import json
import os
import sys
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

FULL_PHRASES = {
    "p_sum_find": "Найди сумму чисел,",
    "p_sum_calc": "Вычисли сумму чисел,",
    "p_term1": "Первое слагаемое,",
    "p_term2": "второе слагаемое,",
    "p_sum_short": "Найди сумму.",
    "p_diff_find": "Найди разность чисел,",
    "p_diff_calc": "Вычисли разность чисел,",
    "p_minuend": "Уменьшаемое,",
    "p_subtrahend": "вычитаемое,",
    "p_diff_short": "Найди разность.",
    "p_prod_find": "Найди произведение чисел,",
    "p_prod_calc": "Вычисли произведение чисел,",
    "p_factor1": "Первый множитель,",
    "p_factor2": "второй множитель,",
    "p_prod_short": "Найди произведение.",
    "p_quot_find": "Найди частное чисел,",
    "p_quot_calc": "Вычисли частное чисел,",
    "p_dividend": "Делимое,",
    "p_divisor": "делитель,",
    "p_quot_short": "Найди частное.",
    "p_howmuch": "На сколько,",
    "p_howmany": "Во сколько раз,",
    "p_more": "больше,",
    "p_less": "меньше,",
}


def ru_number(n):
    if n < 10:
        return ONES[n]
    if n < 20:
        return TEENS[n - 10]
    if n == 100:
        return "сто"
    tens, ones = divmod(n, 10)
    return TENS[tens] + (" " + ONES[ones] if ones else "")


def light_texts():
    texts = {}
    for n in range(101):
        texts["n%d" % n] = ru_number(n) + "."
        for key, word in OPS:
            texts["%s%d" % (key, n)] = ru_number(n) + " " + word
    return texts


def full_texts():
    texts = dict(FULL_PHRASES)
    for n in range(101):
        texts["m%d" % n] = ru_number(n) + ","
        texts["i%d" % n] = "и " + ru_number(n) + "."
        texts["q%d" % n] = ru_number(n) + "?"
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


def write_wav(path, pcm):
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(pcm, -1, 1) * 32767).astype(np.int16).tobytes())


def build_bank(model, name, texts, gap, bitrate, previews):
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
            print("%s: generated %d/%d" % (name, i + 1, len(keys)), flush=True)

    pcm = np.concatenate(pcm_parts)
    pcm16 = (np.clip(pcm, -1, 1) * 32767).astype(np.int16)

    enc = lameenc.Encoder()
    enc.set_bit_rate(bitrate)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    mp3 = enc.encode(pcm16.tobytes()) + enc.flush()

    base = "ru-v5-baya" if name == "light" else "ru-v5-baya-" + name
    with open(os.path.join(OUT_DIR, base + ".mp3"), "wb") as f:
        f.write(mp3)

    meta = {
        "version": 1,
        "voice": "v5-baya",
        "sampleRate": SR,
        "gap": gap,
        "clips": clips,
    }
    with open(os.path.join(OUT_DIR, base + ".json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    print("%s: mp3 %.2f MB, %.1f s" % (name, len(mp3) / 1048576, len(pcm) / SR), flush=True)

    gap_pcm = np.zeros(int(gap * SR), dtype=np.float32)
    sentence_gap = np.zeros(int(0.45 * SR), dtype=np.float32)
    parts = []
    for seq in previews:
        for j, key in enumerate(seq):
            parts.append(pcm_parts[keys.index(key)])
            if j + 1 < len(seq):
                parts.append(gap_pcm)
        parts.append(sentence_gap)
    write_wav(os.path.join(PREVIEW_DIR, base + "-preview.wav"), np.concatenate(parts))
    print("preview:", os.path.join(PREVIEW_DIR, base + "-preview.wav"), flush=True)


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)

    model, _ = silero_tts(language="ru", speaker="v5_ru")
    model.to(torch.device("cpu"))

    if which in ("light", "all"):
        build_bank(model, "light", light_texts(), 0.06, BITRATE, [
            ["add54", "n27"], ["sub63", "n28"], ["mul7", "n8"],
            ["div81", "n9"], ["sub100", "n47"], ["add12", "n9"], ["sub95", "n7"],
        ])

    if which in ("full", "all"):
        build_bank(model, "full", full_texts(), 0.18, BITRATE, [
            ["p_minuend", "m63", "p_subtrahend", "m28", "p_diff_short"],
            ["p_sum_find", "m54", "i27"],
            ["p_factor1", "m7", "p_factor2", "m8", "p_prod_short"],
            ["p_dividend", "m81", "p_divisor", "m9", "p_quot_short"],
            ["p_howmuch", "m54", "p_more", "q27"],
            ["p_howmany", "m56", "p_more", "q7"],
        ])


if __name__ == "__main__":
    main()
