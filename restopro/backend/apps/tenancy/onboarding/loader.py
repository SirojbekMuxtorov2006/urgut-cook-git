from decimal import Decimal

from django.db import transaction

from apps.core import context
from apps.floor.models import Hall, Table
from apps.inventory.models import Ingredient, TechCard, TechCardItem, Warehouse
from apps.inventory.services import recalc_menu_item_cost
from apps.menu.models import Category, KitchenStation, MenuItem

from .data import INGREDIENTS, SEMI_PRODUCTS, STATIONS, TEMPLATES


def _d(v) -> Decimal:
    return Decimal(str(v))


@transaction.atomic
def apply_template(company, branch, business_type: str, with_halls: bool = True) -> dict:
    """Biznes turiga mos sexlar, kategoriyalar, taomlar, retseptlar va zallarni yaratadi."""
    tpl = TEMPLATES.get(business_type) or TEMPLATES["NATIONAL"]
    with context.tenant_context(company.id, branch.id):
        stations = {}
        for i, code in enumerate(tpl["stations"]):
            name, color = STATIONS[code]
            stations[code] = KitchenStation.objects.create(
                company=company, name=name, code=code, color=color, sort=i)

        Warehouse.objects.create(company=company, branch=branch, name="Asosiy ombor", is_default=True)

        # Kerakli xomashyolarni aniqlash
        needed = set()
        for item in tpl["items"]:
            for code, _q, _w in item[7]:
                if code in SEMI_PRODUCTS:
                    needed.update(c for c, _, _ in SEMI_PRODUCTS[code][3])
                needed.add(code)

        ingredients = {}
        for code, (name, unit, price, pack, pack_size) in INGREDIENTS.items():
            if code in needed:
                ingredients[code] = Ingredient.objects.create(
                    company=company, name=name, unit=unit, cost_price=_d(price), pack_name=pack,
                    pack_size=_d(pack_size), min_stock=_d(0))
        for code, (name, unit, output, recipe) in SEMI_PRODUCTS.items():
            if code not in needed:
                continue
            semi = Ingredient.objects.create(company=company, name=name, unit=unit, is_semi_product=True)
            tc = TechCard.objects.create(company=company, semi_product=semi, output_qty=_d(output))
            for icode, q, w in recipe:
                TechCardItem.objects.create(company=company, tech_card=tc, ingredient=ingredients[icode],
                                            gross_qty=_d(q), waste_percent=_d(w))
            ingredients[code] = semi

        overrides = tpl.get("station_override", {})
        categories = {}
        for i, (code, (uz, ru, en, color, st)) in enumerate(tpl["categories"].items()):
            st = overrides.get(code, st)
            categories[code] = Category.objects.create(
                company=company, name_uz=uz, name_ru=ru, name_en=en, color=color,
                station=stations.get(st) or next(iter(stations.values())), sort=i)

        items = []
        for i, (cat, uz, ru, en, price, unit, minutes, recipe) in enumerate(tpl["items"]):
            mi = MenuItem.objects.create(
                company=company, category=categories[cat], name_uz=uz, name_ru=ru, name_en=en,
                price=_d(price), unit=unit, cook_time_minutes=minutes, sort=i)
            tc = TechCard.objects.create(company=company, menu_item=mi, output_qty=_d(1))
            for icode, q, w in recipe:
                TechCardItem.objects.create(company=company, tech_card=tc, ingredient=ingredients[icode],
                                            gross_qty=_d(q), waste_percent=_d(w))
            recalc_menu_item_cost(mi)
            items.append(mi)

        tables = 0
        if with_halls:
            for hi, (hname, count, seats) in enumerate(tpl["halls"]):
                hall = Hall.objects.create(company=company, branch=branch, name=hname, sort=hi)
                for n in range(1, count + 1):
                    Table.objects.create(
                        company=company, branch=branch, hall=hall, name=str(tables + n), seats=seats,
                        pos_x=((n - 1) % 4) * 140 + 20, pos_y=((n - 1) // 4) * 140 + 20, sort=n)
                tables += count

    return {"stations": len(stations), "categories": len(categories), "items": len(items), "tables": tables}


@transaction.atomic
def init_branch(company, branch, halls=(("Asosiy zal", 10, 4),)) -> None:
    """Yangi filial: ombor va bitta zal (menyu va sexlar kompaniya bo'yicha umumiy)."""
    with context.tenant_context(company.id, branch.id):
        Warehouse.objects.create(company=company, branch=branch, name="Asosiy ombor", is_default=True)
        n = 0
        for hi, (hname, count, seats) in enumerate(halls):
            hall = Hall.objects.create(company=company, branch=branch, name=hname, sort=hi)
            for i in range(1, count + 1):
                n += 1
                Table.objects.create(company=company, branch=branch, hall=hall, name=str(n), seats=seats,
                                     pos_x=((i - 1) % 4) * 140 + 20, pos_y=((i - 1) // 4) * 140 + 20, sort=i)
