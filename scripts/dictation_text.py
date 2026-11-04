"""Shared Russian texts for the math dictation audio banks."""

ONES = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
         "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят",
        "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
GEN_ONES = ["нуля", "одного", "двух", "трёх", "четырёх", "пяти", "шести", "семи", "восьми", "девяти"]
GEN_TEENS = ["десяти", "одиннадцати", "двенадцати", "тринадцати", "четырнадцати",
             "пятнадцати", "шестнадцати", "семнадцати", "восемнадцати", "девятнадцати"]
GEN_TENS = ["", "", "двадцати", "тридцати", "сорока", "пятидесяти",
            "шестидесяти", "семидесяти", "восьмидесяти", "девяноста"]
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


def ru_number_genitive(n):
    if n < 10:
        return GEN_ONES[n]
    if n < 20:
        return GEN_TEENS[n - 10]
    if n == 100:
        return "ста"
    tens, ones = divmod(n, 10)
    return GEN_TENS[tens] + (" " + GEN_ONES[ones] if ones else "")


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
        texts["g%d" % n] = ru_number_genitive(n) + "?"
    return texts
