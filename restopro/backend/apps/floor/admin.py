from django.contrib import admin

from apps.core.admin_mixins import TenantAdmin
from apps.floor.models import Hall, Table


@admin.register(Hall)
class HallAdmin(TenantAdmin):
    list_display = ("name", "branch", "company")


@admin.register(Table)
class TableAdmin(TenantAdmin):
    list_display = ("name", "hall", "seats", "status", "company")
