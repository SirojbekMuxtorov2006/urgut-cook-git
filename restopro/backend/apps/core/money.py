"""Pul va miqdor bilan ishlash. Float ishlatilmaydi — faqat Decimal."""
from decimal import ROUND_HALF_UP, Decimal

MONEY_Q = Decimal("0.01")
QTY_Q = Decimal("0.001")


def to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if isinstance(value, float):
        value = repr(value)
    return Decimal(str(value))


def money(value) -> Decimal:
    return to_decimal(value).quantize(MONEY_Q, rounding=ROUND_HALF_UP)


def qty(value) -> Decimal:
    return to_decimal(value).quantize(QTY_Q, rounding=ROUND_HALF_UP)


def format_sum(value, currency="so'm") -> str:
    """92400 -> '92 400 so'm'"""
    d = money(value)
    whole = int(d)
    frac = d - whole
    s = f"{abs(whole):,}".replace(",", " ")
    if whole < 0:
        s = "-" + s
    if frac:
        s += "," + f"{frac:.2f}"[2:]
    return f"{s} {currency}".strip()
