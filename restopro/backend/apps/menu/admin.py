from django.contrib import admin

from apps.core.admin_mixins import TenantAdmin
from apps.menu.models import Category, KitchenStation, MenuItem


@admin.register(KitchenStation)
class KitchenStationAdmin(TenantAdmin):
    list_display = ("name", "code", "company")


@admin.register(Category)
class CategoryAdmin(TenantAdmin):
    list_display = ("name_uz", "company", "station", "sort")


@admin.register(MenuItem)
class MenuItemAdmin(TenantAdmin):
    list_display = ("name_uz", "category", "price", "cost_price", "is_available", "company")
    search_fields = ("name_uz", "name_ru")
