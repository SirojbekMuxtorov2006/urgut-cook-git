from decimal import Decimal

from apps.core.money import money


def tech_card_cost(tech_card, _depth=0) -> Decimal:
    """Retsept tannarxi = sum(brutto * xomashyo narxi) / chiqish. Yarim tayyor mahsulot rekursiv."""
    if _depth > 5:
        raise ValueError("Retsept juda chuqur yoki aylanma bog'langan")
    total = Decimal("0")
    for item in tech_card.items.select_related("ingredient").all():
        ing = item.ingredient
        unit_cost = ing.cost_price
        if ing.is_semi_product and hasattr(ing, "tech_card"):
            unit_cost = tech_card_cost(ing.tech_card, _depth + 1)
        total += item.gross_qty * unit_cost
    if tech_card.output_qty:
        total = total / tech_card.output_qty
    return money(total)


def recalc_menu_item_cost(menu_item) -> Decimal:
    tc = getattr(menu_item, "tech_card", None)
    cost = tech_card_cost(tc) if tc else Decimal("0")
    if menu_item.cost_price != cost:
        menu_item.cost_price = cost
        menu_item.save(update_fields=["cost_price"])
    return cost
