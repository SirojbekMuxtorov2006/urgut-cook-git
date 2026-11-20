from django.contrib import admin


class TenantAdmin(admin.ModelAdmin):
    """Django admin — faqat superadmin uchun, barcha tenantlarni ko'radi."""

    def get_queryset(self, request):
        return self.model.all_objects.all()

    list_filter = ("company",)
    readonly_fields = ("id", "created_at", "updated_at", "version")
