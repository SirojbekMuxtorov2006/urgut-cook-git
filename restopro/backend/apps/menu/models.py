"""Menyu (1-bosqich: asosiy modellar; variantlar, modifierlar, narx turlari — 2-bosqichda)."""
from django.db import models

from apps.core.fields import MoneyField
from apps.core.models import TenantBaseModel


class KitchenStation(TenantBaseModel):
    """Sex: Issiq, Sovuq, Gril, Bar, Somsa tandiri... (kompaniya darajasida;
    har filialda qaysi printerga borishi printing.PrinterRoute orqali belgilanadi)."""

    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=30)
    color = models.CharField(max_length=9, default="#F97316")
    sort = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(TenantBaseModel.Meta):
        ordering = ["sort", "name"]

    def __str__(self):
        return self.name


class Category(TenantBaseModel):
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    name_uz = models.CharField(max_length=150)
    name_ru = models.CharField(max_length=150, blank=True)
    name_en = models.CharField(max_length=150, blank=True)
    color = models.CharField(max_length=9, default="#F97316")
    image = models.ImageField(upload_to="categories/", null=True, blank=True)
    station = models.ForeignKey(KitchenStation, on_delete=models.SET_NULL, null=True, blank=True, related_name="+",
                                help_text="Standart sex (taomda alohida ko'rsatilmasa)")
    sort = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(TenantBaseModel.Meta):
        ordering = ["sort", "name_uz"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name_uz


class MenuItem(TenantBaseModel):
    class Unit(models.TextChoices):
        PORTION = "portion", "porsiya"
        KG = "kg", "kg"
        PCS = "pcs", "dona"
        L = "l", "l"

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="items")
    name_uz = models.CharField(max_length=200)
    name_ru = models.CharField(max_length=200, blank=True)
    name_en = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="menu/", null=True, blank=True)
    price = MoneyField()
    cost_price = MoneyField(help_text="Retseptdan avtomatik hisoblanadi")
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.PORTION)
    station = models.ForeignKey(KitchenStation, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    cook_time_minutes = models.PositiveIntegerField(default=10)
    barcode = models.CharField(max_length=64, blank=True)
    is_available = models.BooleanField(default=True, help_text="'Tugadi' tugmasi")
    is_favorite = models.BooleanField(default=False)
    sort = models.PositiveIntegerField(default=0)

    class Meta(TenantBaseModel.Meta):
        ordering = ["sort", "name_uz"]

    def __str__(self):
        return self.name_uz

    @property
    def effective_station_id(self):
        return self.station_id or self.category.station_id
