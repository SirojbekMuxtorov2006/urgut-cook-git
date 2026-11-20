from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.core import context
from apps.core.docnum import format_doc_number, next_doc_number
from apps.core.ids import uuid7
from apps.core.money import format_sum, money
from apps.floor.models import Hall
from apps.inventory.models import Ingredient, TechCard, TechCardItem
from apps.inventory.services import recalc_menu_item_cost, tech_card_cost
from apps.menu.models import Category, MenuItem
from apps.tenancy.models import Subscription


def test_uuid7_is_time_ordered_and_v7():
    ids = [uuid7() for _ in range(50)]
    assert all(i.version == 7 for i in ids)
    assert ids == sorted(ids)


@pytest.mark.parametrize("value,expected", [
    (92400, "92 400 so'm"), (Decimal("1234567.5"), "1 234 567,50 so'm"), (0, "0 so'm"), (-8400, "-8 400 so'm"),
])
def test_format_sum(value, expected):
    assert format_sum(value) == expected


def test_money_rounding_no_float_artifacts():
    assert money(0.1 + 0.2) == Decimal("0.30")
    assert money("8400.005") == Decimal("8400.01")


def test_doc_number_format(company_a):
    assert format_doc_number("K1", 2026, 4512) == "K1-2026-004512"
    n1 = next_doc_number(company_a.device)
    n2 = next_doc_number(company_a.device)
    year = timezone.localdate().year
    assert n1 == f"{company_a.device.code}-{year}-000001"
    assert n2.endswith("000002")


def test_tenant_manager_filters_by_context(company_a, company_b):
    with context.tenant_context(company_a.id):
        names = set(Hall.objects.values_list("company_id", flat=True))
    assert names == {company_a.id}
    assert Hall.all_objects.filter(company_id=company_b.id).exists()


def test_save_without_tenant_raises(db):
    with pytest.raises(ValueError):
        Category(name_uz="X").save()


def test_soft_delete_and_version(company_a):
    with context.tenant_context(company_a.id):
        cat = Category.objects.create(name_uz="Test")
        assert cat.version == 1
        cat.name_uz = "Test 2"
        cat.save()
        assert cat.version == 2
        cat.delete()
        assert not Category.objects.filter(pk=cat.pk).exists()
        assert Category.all_objects.filter(pk=cat.pk, deleted_at__isnull=False).exists()


def test_new_record_takes_company_from_context(company_a):
    with context.tenant_context(company_a.id, user_id=company_a.owner.id):
        cat = Category.objects.create(name_uz="Ctx")
    assert cat.company_id == company_a.id
    assert cat.created_by_id == company_a.owner.id


def test_tech_card_cost_with_semi_product(company_a):
    with context.tenant_context(company_a.id):
        rice = Ingredient.objects.create(name="Guruch", unit="kg", cost_price=Decimal("20000"))
        meat = Ingredient.objects.create(name="Go'sht", unit="kg", cost_price=Decimal("100000"))
        zirvak = Ingredient.objects.create(name="Zirvak", unit="kg", is_semi_product=True)
        ztc = TechCard.objects.create(semi_product=zirvak, output_qty=Decimal("2"))
        TechCardItem.objects.create(tech_card=ztc, ingredient=meat, gross_qty=Decimal("1"))  # 100000 / 2 kg
        cat = Category.objects.create(name_uz="Osh")
        osh = MenuItem.objects.create(category=cat, name_uz="Osh", price=Decimal("40000"))
        tc = TechCard.objects.create(menu_item=osh)
        TechCardItem.objects.create(tech_card=tc, ingredient=rice, gross_qty=Decimal("0.150"))
        TechCardItem.objects.create(tech_card=tc, ingredient=zirvak, gross_qty=Decimal("0.200"))
        # 0.150*20000 + 0.200*50000 = 3000 + 10000
        assert tech_card_cost(tc) == Decimal("13000.00")
        assert recalc_menu_item_cost(osh) == Decimal("13000.00")
        osh.refresh_from_db()
        assert osh.cost_price == Decimal("13000.00")


def test_onboarding_template_loaded(company_a):
    with context.tenant_context(company_a.id):
        assert MenuItem.objects.count() == 40
        assert MenuItem.objects.filter(cost_price__gt=0).count() == 40
        assert Hall.objects.count() == 2


def test_subscription_status_transitions(company_a):
    sub = company_a.company.subscription
    now = timezone.now()
    sub.ends_at = now - timedelta(days=1)
    assert sub.compute_status(now) == Subscription.Status.GRACE
    sub.ends_at = now - timedelta(days=4)
    assert sub.compute_status(now) == Subscription.Status.EXPIRED
    assert sub.access == Subscription.Access.READ_ONLY
