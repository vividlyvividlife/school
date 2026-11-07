"""Russian texts for the clock dictation audio bank.

Times are spelled out because the audio banks carry no text normaliser:
"07:20" has to be written as "семь часов двадцать минут".
"""

from dictation_text import ru_number

HOUR_FORMS = ("час", "часа", "часов")
MIN_FORMS = ("минута", "минуты", "минут")
# After "через", "на", "назад" only the singular feminine differs from the nominative.
MIN_FORMS_ACC = ("минуту", "минуты", "минут")

PROMPTS = {
    "read": "Который час?",
    "show": "Найди эти часы.",
    "plus": "Который час будет через {d}?",
    "minus": "Который час был {d} назад?",
    "fast": "Часы спешат на {d}. Который час на самом деле?",
    "slow": "Часы отстают на {d}. Который час на самом деле?",
    "lesson_end": "Урок длился {d}. Во сколько он закончился?",
    "lesson_start": "Урок длился {d}. Во сколько он начался?",
}

DAY_PARTS = ((6, "ночи"), (12, "утра"), (18, "дня"), (24, "вечера"))


def plural(n, forms):
    n10, n100 = n % 10, n % 100
    if n10 == 1 and n100 != 11:
        return forms[0]
    if 2 <= n10 <= 4 and not 12 <= n100 <= 14:
        return forms[1]
    return forms[2]


def day_part(h):
    for edge, name in DAY_PARTS:
        if h < edge:
            return name
    return "ночи"


def _feminine(n):
    """ru_number with "один" agreed as feminine, as required by "минута"."""
    text = ru_number(n)
    return text if n % 10 != 1 or n == 11 else text[:-len("один")] + "одна"


def hour_words(h, fmt24=False):
    hh = h if fmt24 else (h % 12 or 12)
    return f"{ru_number(hh)} {plural(hh, HOUR_FORMS)}"


def minute_words(m):
    if not m:
        return ""
    return f"{_feminine(m)} {plural(m, MIN_FORMS)}"


def dur_minutes(n):
    if n == 30:
        return "полчаса"
    if n % 10 == 1 and n != 11:
        return "одну минуту" if n == 1 else f"{ru_number(n)[:-len('один')]}одну минуту"
    return f"{ru_number(n)} {plural(n, MIN_FORMS_ACC)}"


def dur_hours(n):
    return f"{ru_number(n)} {plural(n, HOUR_FORMS)}"


def speak_time(h, m, fmt24=False, with_day_part=False):
    if m:
        body = f"{hour_words(h, fmt24)} {minute_words(m)}"
    else:
        body = f"ровно {hour_words(h, fmt24)}"
    if with_day_part:
        body += " " + day_part(h)
    return body[0].upper() + body[1:] + "."


def prompt(kind, **kw):
    text = PROMPTS[kind]
    for key, value in kw.items():
        text = text.replace("{%s}" % key, value)
    return text


def minutes_for_step(step):
    if step == 30:
        return [0, 30]
    if step == 5:
        return list(range(0, 60, 5))
    return list(range(0, 60))


def bank_texts(step=5, fmt24=False, with_day_part=False):
    """Clip texts for one grid: every shown time plus the task wordings."""
    texts = {"p_read": PROMPTS["read"], "p_show": PROMPTS["show"]}
    hours = range(0, 24) if fmt24 else range(1, 13)
    for h in hours:
        for m in minutes_for_step(step):
            texts["t_%d_%d" % (h, m)] = speak_time(h, m, fmt24, with_day_part)
    for n in sorted({d for d in minutes_for_step(step) if d} | {1, 2, 3, 4}):
        d = dur_minutes(n)
        texts["d_plus_%d" % n] = prompt("plus", d=d)
        texts["d_minus_%d" % n] = prompt("minus", d=d)
        texts["d_fast_%d" % n] = prompt("fast", d=d)
        texts["d_slow_%d" % n] = prompt("slow", d=d)
        texts["d_lesson_end_%d" % n] = prompt("lesson_end", d=d)
        texts["d_lesson_start_%d" % n] = prompt("lesson_start", d=d)
    for n in (1, 2, 3, 4, 5):
        d = dur_hours(n)
        texts["h_plus_%d" % n] = prompt("plus", d=d)
        texts["h_minus_%d" % n] = prompt("minus", d=d)
    return texts


AUDITION = [
    "Который час?",
    "Семь часов двадцать минут.",
    "Ровно три часа.",
    "Двенадцать часов сорок пять минут вечера.",
    "Который час будет через десять минут?",
    "Который час был полчаса назад?",
    "Часы спешат на пять минут. Который час на самом деле?",
    "Урок длился двадцать пять минут. Во сколько он закончился?",
    "Ноль часов пять минут.",
    "Двадцать одна минута после шести.",
]
