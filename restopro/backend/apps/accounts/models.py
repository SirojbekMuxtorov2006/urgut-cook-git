import hashlib
import hmac

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.ids import uuid7
from apps.core.models import BranchScopedModel, TenantBaseModel


class Permission(models.Model):
    """Global huquqlar katalogi (catalog.PERMISSIONS dan migratsiya orqali yuklanadi)."""

    code = models.CharField(max_length=64, primary_key=True)
    name_uz = models.CharField(max_length=150)
    name_ru = models.CharField(max_length=150)
    group = models.CharField(max_length=50)

    class Meta:
        ordering = ["group", "code"]

    def __str__(self):
        return self.code


class Role(TenantBaseModel):
    class LoginType(models.TextChoices):
        PIN = "pin", "PIN (4 raqam)"
        PASSWORD = "password", "Telefon + parol"

    code = models.SlugField(max_length=50)
    name = models.CharField(max_length=100)
    is_system = models.BooleanField(default=False)
    login_type = models.CharField(max_length=10, choices=LoginType.choices, default=LoginType.PIN)
    all_permissions = models.BooleanField(default=False, help_text="Ega roli: barcha huquqlar")
    permissions = models.ManyToManyField(Permission, blank=True, related_name="roles")
    discount_limit_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    own_tables_only = models.BooleanField(default=False, help_text="Ofitsiant faqat o'z stollarini ko'radi")

    class Meta(TenantBaseModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=["company", "code"], condition=models.Q(deleted_at__isnull=True),
                                    name="uniq_role_code")
        ]

    def __str__(self):
        return self.name

    def permission_codes(self) -> set[str]:
        if self.all_permissions:
            from apps.accounts.catalog import PERMISSION_CODES

            return set(PERMISSION_CODES)
        return set(self.permissions.values_list("code", flat=True))


class UserManager(BaseUserManager):
    use_in_migrations = True

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

    def create_user(self, phone=None, password=None, **extra):
        user = self.model(phone=phone or None, **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password, **extra):
        extra.update(is_staff=True, is_superuser=True)
        return self.create_user(phone, password, **extra)


def pin_digest(company_id, pin: str) -> str:
    """PIN'ni kompaniya ichida tez topish uchun HMAC (PIN o'zi argon2 bilan alohida tekshiriladi)."""
    key = settings.SECRET_KEY.encode()
    return hmac.new(key, f"{company_id}:{pin}".encode(), hashlib.sha256).hexdigest()


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    company = models.ForeignKey("tenancy.Company", on_delete=models.CASCADE, null=True, blank=True,
                                related_name="users")
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=150)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    branches = models.ManyToManyField("tenancy.Branch", through="UserBranch", through_fields=("user", "branch"),
                                      blank=True, related_name="+")
    pin_hash = models.CharField(max_length=200, blank=True)
    pin_lookup = models.CharField(max_length=64, blank=True, db_index=True)
    pin_fail_count = models.PositiveSmallIntegerField(default=0)
    pin_locked_until = models.DateTimeField(null=True, blank=True)
    language = models.CharField(max_length=5, default="uz")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()
    all_objects = models.Manager()

    class Meta:
        indexes = [models.Index(fields=["company", "updated_at"], name="accounts_user_cu")]
        constraints = [
            models.UniqueConstraint(fields=["company", "pin_lookup"],
                                    condition=~models.Q(pin_lookup="") & models.Q(deleted_at__isnull=True),
                                    name="uniq_user_pin_per_company")
        ]

    def __str__(self):
        return self.full_name or self.phone or str(self.id)

    # --- PIN ---
    def set_pin(self, pin: str):
        self.pin_hash = make_password(pin)
        self.pin_lookup = pin_digest(self.company_id, pin)
        self.pin_fail_count = 0
        self.pin_locked_until = None

    def check_pin(self, pin: str) -> bool:
        return bool(self.pin_hash) and check_password(pin, self.pin_hash)

    @property
    def pin_locked(self) -> bool:
        return bool(self.pin_locked_until and self.pin_locked_until > timezone.now())

    # --- huquqlar ---
    @property
    def is_owner(self):
        return bool(self.role and self.role.all_permissions)

    def get_permission_codes(self) -> set[str]:
        if self.is_superuser:
            from apps.accounts.catalog import PERMISSION_CODES

            return set(PERMISSION_CODES)
        if not hasattr(self, "_perm_cache"):
            self._perm_cache = self.role.permission_codes() if self.role_id else set()
        return self._perm_cache

    def has_perm_code(self, code: str) -> bool:
        return code in self.get_permission_codes()

    def can_access_branch(self, branch_id) -> bool:
        if self.is_superuser or self.is_owner:
            return True
        return UserBranch.all_objects.filter(user=self, branch_id=branch_id, deleted_at__isnull=True).exists()


class UserBranch(BranchScopedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_branches")

    class Meta(BranchScopedModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=["user", "branch"], condition=models.Q(deleted_at__isnull=True),
                                    name="uniq_user_branch")
        ]


class AuditLog(TenantBaseModel):
    """Append-only: kim, qachon, nima qildi, eski/yangi qiymat, qurilma."""

    class Severity(models.TextChoices):
        INFO = "INFO"
        WARNING = "WARNING"  # chegirma, bekor qilish — o'g'rilikka qarshi hisobot
        CRITICAL = "CRITICAL"

    branch = models.ForeignKey("tenancy.Branch", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    action = models.CharField(max_length=64, db_index=True)
    entity = models.CharField(max_length=64, blank=True)
    entity_id = models.CharField(max_length=64, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.INFO)
    ip = models.GenericIPAddressField(null=True, blank=True)
    impersonated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta(TenantBaseModel.Meta):
        ordering = ["-created_at"]


class Attendance(BranchScopedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attendance")
    check_in = models.DateTimeField(default=timezone.now)
    check_out = models.DateTimeField(null=True, blank=True)

    class Meta(BranchScopedModel.Meta):
        ordering = ["-check_in"]


class SmsCode(models.Model):
    class Purpose(models.TextChoices):
        REGISTER = "register"
        RESET_PASSWORD = "reset_password"

    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    phone = models.CharField(max_length=20, db_index=True)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    code_hash = models.CharField(max_length=200)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
