from django.contrib import admin

from apps.core.admin_mixins import TenantAdmin
from apps.inventory.models import Ingredient, TechCard, TechCardItem, Warehouse


class TechCardItemInline(admin.TabularInline):
    model = TechCardItem
    extra = 0
    exclude = ("company", "created_by", "device", "deleted_at", "version")


@admin.register(Ingredient)
class IngredientAdmin(TenantAdmin):
    list_display = ("name", "unit", "cost_price", "is_semi_product", "company")


@admin.register(TechCard)
class TechCardAdmin(TenantAdmin):
    list_display = ("__str__", "output_qty", "company")
    inlines = [TechCardItemInline]


@admin.register(Warehouse)
class WarehouseAdmin(TenantAdmin):
    list_display = ("name", "branch", "company")
