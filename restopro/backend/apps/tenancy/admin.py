from django.contrib import admin

from apps.core.admin_mixins import TenantAdmin
from apps.tenancy.models import Branch, Company, Device, Plan, Setting, Subscription, SubscriptionPayment


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "price_monthly", "max_branches", "max_pos", "max_waiters", "max_kds", "is_active")


class SubscriptionInline(admin.TabularInline):
    model = Subscription
    extra = 0


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "business_type", "phone", "status", "created_at")
    list_filter = ("business_type", "status")
    search_fields = ("name", "phone", "inn")
    inlines = [SubscriptionInline]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("company", "plan", "status", "starts_at", "ends_at")
    list_filter = ("status", "plan")


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ("subscription", "amount", "provider", "status", "paid_at")


@admin.register(Branch)
class BranchAdmin(TenantAdmin):
    list_display = ("name", "code", "company", "is_active")


@admin.register(Device)
class DeviceAdmin(TenantAdmin):
    list_display = ("name", "code", "mode", "company", "branch", "is_active", "last_seen_at")
    list_filter = ("mode", "is_active", "company")
    exclude = ("token_hash",)


@admin.register(Setting)
class SettingAdmin(TenantAdmin):
    list_display = ("key", "company", "branch")
