from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import AuditLog, Permission, Role, User
from apps.core.admin_mixins import TenantAdmin


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("full_name",)
    list_display = ("full_name", "phone", "company", "role", "is_active")
    list_filter = ("is_active", "is_superuser", "company")
    search_fields = ("full_name", "phone")
    fieldsets = (
        (None, {"fields": ("phone", "password", "full_name", "company", "role", "language")}),
        ("Holat", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("phone", "full_name", "password1", "password2")}),)
    filter_horizontal = ()


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "name_uz", "group")


@admin.register(Role)
class RoleAdmin(TenantAdmin):
    list_display = ("name", "code", "company", "is_system", "login_type")
    filter_horizontal = ("permissions",)


@admin.register(AuditLog)
class AuditLogAdmin(TenantAdmin):
    list_display = ("created_at", "company", "action", "user", "severity")
    list_filter = ("severity", "action")

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
