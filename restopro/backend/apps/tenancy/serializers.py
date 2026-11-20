from rest_framework import serializers

from apps.core.serializers import TenantModelSerializer
from apps.tenancy.models import Branch, Company, Device, Plan, Setting, Subscription


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ("id", "code", "name", "price_monthly", "max_branches", "max_pos", "max_waiters", "max_kds",
                  "max_managers", "max_couriers", "modules")


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    status = serializers.SerializerMethodField()
    access = serializers.CharField(read_only=True)
    days_left = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = ("id", "plan", "status", "access", "starts_at", "ends_at", "days_left")

    def get_status(self, obj) -> str:
        return obj.compute_status()

    def get_days_left(self, obj) -> int:
        from django.utils import timezone

        return max((obj.ends_at - timezone.now()).days, 0)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "name", "business_type", "phone", "legal_name", "inn", "logo", "currency", "language",
                  "status", "created_at")
        read_only_fields = ("id", "business_type", "status", "created_at")


class BranchSerializer(TenantModelSerializer):
    class Meta:
        model = Branch
        fields = ("id", "name", "code", "address", "phone", "latitude", "longitude", "service_charge_percent",
                  "receipt_header", "receipt_footer", "is_active", "created_at", "updated_at", "version")
        read_only_fields = ("id", "created_at", "updated_at", "version")

    def validate_code(self, value):
        qs = Branch.objects.filter(company_id=self.context["request"].company_id, code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Bu kod band")
        return value


class DeviceSerializer(TenantModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    online = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = ("id", "name", "code", "mode", "branch", "branch_name", "is_backup_hub", "platform",
                  "app_version", "local_ip", "last_seen_at", "online", "is_active", "created_at")
        read_only_fields = ("id", "code", "mode", "branch", "platform", "app_version", "local_ip", "last_seen_at",
                            "created_at")

    def get_online(self, obj) -> bool:
        from django.utils import timezone

        return bool(obj.last_seen_at and (timezone.now() - obj.last_seen_at).total_seconds() < 180)


class SettingSerializer(TenantModelSerializer):
    class Meta:
        model = Setting
        fields = ("id", "branch", "key", "value", "updated_at")
        read_only_fields = ("id", "updated_at")


class LicenseSerializer(serializers.Serializer):
    token = serializers.CharField()
    public_key = serializers.CharField()
    payload = serializers.DictField()
