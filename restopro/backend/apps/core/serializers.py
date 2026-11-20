from rest_framework import serializers

from apps.core import context


class TenantPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """FK maydoni — faqat joriy kompaniya yozuvlarini qabul qiladi (boshqa tenant ID'si o'tmaydi)."""

    def get_queryset(self):
        qs = super().get_queryset()
        request = self.context.get("request")
        company_id = getattr(request, "company_id", None) or context.get_company_id()
        return qs.filter(company_id=company_id)


class TenantModelSerializer(serializers.ModelSerializer):
    serializer_related_field = TenantPrimaryKeyRelatedField

    class Meta:
        read_only_fields = ("id", "created_at", "updated_at", "version")
