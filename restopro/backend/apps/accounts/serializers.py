import re

from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import AuditLog, Permission, Role, User, UserBranch, pin_digest
from apps.core.serializers import TenantModelSerializer
from apps.tenancy.models import Branch, BusinessType, Device


class SendCodeSerializer(serializers.Serializer):
    phone = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    phone = serializers.CharField()
    code = serializers.CharField(max_length=6)
    company_name = serializers.CharField(max_length=200)
    business_type = serializers.ChoiceField(choices=BusinessType.choices)
    full_name = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=6, write_only=True)
    language = serializers.ChoiceField(choices=["uz", "ru"], default="uz")


class ResetPasswordSerializer(serializers.Serializer):
    phone = serializers.CharField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField()


class PinLoginSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=4)
    user_id = serializers.UUIDField(required=False)


class ManagerPinSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=4)
    permission = serializers.CharField()


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class RoleBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "code", "name", "login_type", "discount_limit_percent", "own_tables_only")


class BranchBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ("id", "name", "code")


class MeSerializer(serializers.ModelSerializer):
    role = RoleBriefSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    branches = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "phone", "full_name", "language", "role", "permissions", "branches", "company",
                  "is_superuser")
        read_only_fields = ("id", "phone", "role", "permissions", "branches", "company", "is_superuser")

    def get_permissions(self, obj) -> list[str]:
        return sorted(obj.get_permission_codes())

    def get_branches(self, obj) -> list[dict]:
        qs = Branch.all_objects.filter(company_id=obj.company_id, deleted_at__isnull=True, is_active=True)
        if not obj.is_owner:
            qs = qs.filter(id__in=UserBranch.all_objects.filter(user=obj, deleted_at__isnull=True)
                           .values("branch_id"))
        return BranchBriefSerializer(qs, many=True).data

    def get_company(self, obj) -> dict | None:
        if not obj.company_id:
            return None
        c = obj.company
        return {"id": str(c.id), "name": c.name, "business_type": c.business_type, "currency": c.currency}


class AuthResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = MeSerializer()


class DeviceRegisterSerializer(serializers.Serializer):
    branch = serializers.UUIDField()
    mode = serializers.ChoiceField(choices=Device.Mode.choices)
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    platform = serializers.CharField(max_length=20, required=False, allow_blank=True)
    app_version = serializers.CharField(max_length=20, required=False, allow_blank=True)
    hardware_id = serializers.CharField(max_length=128, required=False, allow_blank=True)
    is_backup_hub = serializers.BooleanField(default=False)


class DeviceRegisterResponseSerializer(serializers.Serializer):
    device_id = serializers.UUIDField()
    device_code = serializers.CharField()
    device_token = serializers.CharField()
    mode = serializers.CharField()
    branch = BranchBriefSerializer()
    license = serializers.DictField()


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("code", "name_uz", "name_ru", "group")


class RoleSerializer(TenantModelSerializer):
    permissions = serializers.SlugRelatedField(many=True, slug_field="code", queryset=Permission.objects.all(),
                                               required=False)
    users_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Role
        fields = ("id", "code", "name", "is_system", "login_type", "all_permissions", "permissions",
                  "discount_limit_percent", "own_tables_only", "users_count", "created_at", "updated_at")
        read_only_fields = ("id", "is_system", "all_permissions", "users_count", "created_at", "updated_at")

    def validate_code(self, value):
        request = self.context["request"]
        qs = Role.objects.filter(company_id=request.company_id, code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Bu kod bilan rol mavjud")
        return value

    def validate(self, attrs):
        if self.instance and self.instance.all_permissions and "permissions" in attrs:
            raise serializers.ValidationError("Ega rolining huquqlarini o'zgartirib bo'lmaydi")
        return attrs


class EmployeeSerializer(TenantModelSerializer):
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())
    role_name = serializers.CharField(source="role.name", read_only=True)
    branches = serializers.PrimaryKeyRelatedField(many=True, queryset=Branch.objects.all(), required=False)
    pin = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=4, max_length=4)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    has_pin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "full_name", "phone", "role", "role_name", "branches", "language", "is_active",
                  "pin", "password", "has_pin", "created_at")
        read_only_fields = ("id", "created_at", "has_pin")

    def get_has_pin(self, obj) -> bool:
        return bool(obj.pin_hash)

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        company_id = getattr(request, "company_id", None)
        fields["role"].queryset = Role.objects.filter(company_id=company_id)
        fields["branches"].child_relation.queryset = Branch.objects.filter(company_id=company_id)
        return fields

    def validate_pin(self, value):
        if value and not re.fullmatch(r"\d{4}", value):
            raise serializers.ValidationError("PIN 4 ta raqamdan iborat bo'lishi kerak")
        if value:
            company_id = self.context["request"].company_id
            qs = User.objects.filter(company_id=company_id, pin_lookup=pin_digest(company_id, value))
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Bu PIN boshqa xodimda band. Boshqa PIN tanlang.")
        return value

    def validate_phone(self, value):
        if not value:
            return None
        from apps.accounts.services import normalize_phone

        value = normalize_phone(value)
        qs = User.all_objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Bu telefon raqam band")
        return value

    def validate(self, attrs):
        role = attrs.get("role") or (self.instance.role if self.instance else None)
        if role and role.all_permissions:
            request = self.context["request"]
            if not request.user.is_owner:
                raise serializers.ValidationError({"role": "Ega rolini faqat ega bera oladi"})
        creating = self.instance is None
        if creating and role:
            if role.login_type == Role.LoginType.PIN and not attrs.get("pin"):
                raise serializers.ValidationError({"pin": "Bu rol uchun PIN kerak"})
            if role.login_type == Role.LoginType.PASSWORD and not (attrs.get("phone") and attrs.get("password")):
                raise serializers.ValidationError({"password": "Bu rol uchun telefon va parol kerak"})
        return attrs

    @transaction.atomic
    def create(self, validated):
        branches = validated.pop("branches", [])
        pin = validated.pop("pin", None)
        password = validated.pop("password", None)
        validated.pop("created_by_id", None)
        validated.pop("device_id", None)
        user = User(**validated)
        user.set_password(password) if password else user.set_unusable_password()
        if pin:
            user.set_pin(pin)
        user.save()
        self._set_branches(user, branches)
        return user

    @transaction.atomic
    def update(self, user, validated):
        branches = validated.pop("branches", None)
        pin = validated.pop("pin", None)
        password = validated.pop("password", None)
        for k, v in validated.items():
            setattr(user, k, v)
        if password:
            user.set_password(password)
        if pin:
            user.set_pin(pin)
        user.save()
        if branches is not None:
            self._set_branches(user, branches)
        return user

    def _set_branches(self, user, branches):
        keep = {b.id for b in branches}
        UserBranch.objects.filter(user=user).exclude(branch_id__in=keep).delete()
        existing = set(UserBranch.objects.filter(user=user).values_list("branch_id", flat=True))
        for b in branches:
            if b.id not in existing:
                UserBranch.objects.create(company_id=user.company_id, branch=b, user=user)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["branches"] = list(UserBranch.objects.filter(user=instance).values_list("branch_id", flat=True))
        data["branches"] = [str(b) for b in data["branches"]]
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True, default=None)
    device_code = serializers.CharField(source="device.code", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = ("id", "created_at", "action", "entity", "entity_id", "old_value", "new_value", "reason",
                  "severity", "user", "user_name", "device", "device_code", "branch", "ip")
