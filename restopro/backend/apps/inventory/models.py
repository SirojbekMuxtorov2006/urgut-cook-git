"""Ombor (1-bosqich: xomashyo va texnologik karta; ledger va hujjatlar — 6-bosqichda)."""
from decimal import Decimal

from django.db import models

from apps.core.fields import MoneyField, QtyField
from apps.core.models import BranchScopedModel, TenantBaseModel


class Warehouse(BranchScopedModel):
    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Ingredient(TenantBaseModel):
    class Unit(models.TextChoices):
        KG = "kg", "kg"
        L = "l", "l"
        PCS = "pcs", "dona"

    name = models.CharField(max_length=150)
    unit = models.CharField(max_length=5, choices=Unit.choices, default=Unit.KG)
    cost_price = MoneyField(help_text="1 birlik uchun o'rtacha narx")
    min_stock = QtyField()
    pack_name = models.CharField(max_length=30, blank=True, help_text="Qadoq, masalan 'qop'")
    pack_size = QtyField(default=Decimal("1"), help_text="1 qadoqda nechta birlik (1 qop = 50 kg)")
    is_semi_product = models.BooleanField(default=False, help_text="Yarim tayyor mahsulot (zirvak, xamir...)")

    class Meta(TenantBaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class TechCard(TenantBaseModel):
    """Texnologik karta: taom yoki yarim tayyor mahsulot retsepti."""

    menu_item = models.OneToOneField("menu.MenuItem", on_delete=models.CASCADE, null=True, blank=True,
                                     related_name="tech_card")
    semi_product = models.OneToOneField(Ingredient, on_delete=models.CASCADE, null=True, blank=True,
                                        related_name="tech_card")
    output_qty = QtyField(default=Decimal("1"), help_text="Retsept chiqishi (taom uchun 1 porsiya)")
    note = models.TextField(blank=True)

    class Meta(TenantBaseModel.Meta):
        constraints = [
            models.CheckConstraint(
                condition=models.Q(menu_item__isnull=False) | models.Q(semi_product__isnull=False),
                name="techcard_has_target",
            )
        ]

    def __str__(self):
        return f"Retsept: {self.menu_item or self.semi_product}"


class TechCardItem(TenantBaseModel):
    tech_card = models.ForeignKey(TechCard, on_delete=models.CASCADE, related_name="items")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name="+")
    gross_qty = QtyField(help_text="Brutto (birlikda, masalan 0.150 kg)")
    waste_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    @property
    def net_qty(self) -> Decimal:
        return (self.gross_qty * (Decimal(100) - self.waste_percent) / Decimal(100)).quantize(Decimal("0.001"))
