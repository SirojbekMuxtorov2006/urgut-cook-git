import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.fields import MoneyField
from apps.core.ids import uuid7
from apps.core.models import BranchScopedModel, TenantBaseModel, TimestampedModel


class BusinessType(models.TextChoices):
    NATIONAL = "NATIONAL", "Milliy oshxona (osh markazi, choyxona, somsaxona)"
    RESTAURANT = "RESTAURANT", "Restoran / to'yxona"
    CAFE = "CAFE", "Kafe / kofeyniya"
    FAST_FOOD = "FAST_FOOD", "Fast-food (lavash, burger)"
    DARK_KITCHEN = "DARK_KITCHEN", "Yetkazib berish oshxonasi"


class Module(models.TextChoices):
    QR_MENU = "qr_menu", "QR menyu"
    DELIVERY = "delivery", "Yetkazib berish"
    BANQUET = "banquet", "Banket"
    LOYALTY = "loyalty", "Sodiqlik"
    INVENTORY = "inventory", "Ombor"
    REPORTS_PRO = "reports_pro", "Kengaytirilgan hisobotlar"


class Plan(TimestampedModel):
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    price_monthly = MoneyField()
    max_branches = models.PositiveIntegerField(default=1)
    max_pos = models.PositiveIntegerField(default=1, help_text="Kassa (POS/HUB) qurilmalari")
    max_waiters = models.PositiveIntegerField(default=3, help_text="Ofitsiant qurilmalari")
    max_kds = models.PositiveIntegerField(default=1)
    max_managers = models.PositiveIntegerField(default=2)
    max_couriers = models.PositiveIntegerField(default=0)
    modules = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    sort = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort", "price_monthly"]

    def __str__(self):
        return self.name

    def device_limit(self, mode: str) -> int:
        return {
            Device.Mode.POS: self.max_pos,
            Device.Mode.HUB: self.max_pos,
            Device.Mode.WAITER: self.max_waiters,
            Device.Mode.KDS: self.max_kds,
            Device.Mode.MANAGER: self.max_managers,
            Device.Mode.COURIER: self.max_couriers,
        }[mode]


class Company(TimestampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Faol"
        BLOCKED = "BLOCKED", "Bloklangan"

    name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=20, choices=BusinessType.choices, default=BusinessType.NATIONAL)
    phone = models.CharField(max_length=20)
    legal_name = models.CharField(max_length=200, blank=True)
    inn = models.CharField("STIR (INN)", max_length=20, blank=True)
    logo = models.ImageField(upload_to="logos/", null=True, blank=True)
    currency = models.CharField(max_length=10, default="so'm")
    language = models.CharField(max_length=5, default="uz")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "companies"

    def __str__(self):
        return self.name

    @property
    def subscription(self):
        return self.subscriptions.order_by("-ends_at").first()


class Subscription(TimestampedModel):
    class Status(models.TextChoices):
        TRIAL = "TRIAL", "Sinov"
        ACTIVE = "ACTIVE", "Faol"
        GRACE = "GRACE", "Imtiyozli davr"
        EXPIRED = "EXPIRED", "Muddati tugagan (faqat ko'rish)"

    class Access(models.TextChoices):
        FULL = "full"
        READ_ONLY = "read_only"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.TRIAL)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField()

    def compute_status(self, now=None):
        now = now or timezone.now()
        if now <= self.ends_at:
            return self.status if self.status in (self.Status.TRIAL, self.Status.ACTIVE) else self.Status.ACTIVE
        if now <= self.ends_at + timedelta(days=settings.SUBSCRIPTION_GRACE_DAYS):
            return self.Status.GRACE
        return self.Status.EXPIRED

    @property
    def access(self):
        return self.Access.READ_ONLY if self.compute_status() == self.Status.EXPIRED else self.Access.FULL

    def has_module(self, module: str) -> bool:
        return module in (self.plan.modules or [])


class SubscriptionPayment(TimestampedModel):
    class Provider(models.TextChoices):
        CLICK = "CLICK"
        PAYME = "PAYME"
        MANUAL = "MANUAL"

    class Status(models.TextChoices):
        PENDING = "PENDING"
        PAID = "PAID"
        FAILED = "FAILED"
        CANCELLED = "CANCELLED"

    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name="payments")
    amount = MoneyField()
    months = models.PositiveIntegerField(default=1)
    provider = models.CharField(max_length=10, choices=Provider.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    external_id = models.CharField(max_length=100, blank=True, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    raw = models.JSONField(default=dict, blank=True)


class Branch(TenantBaseModel):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=10, help_text="Qisqa kod, masalan B1")
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    service_charge_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    receipt_header = models.TextField(blank=True)
    receipt_footer = models.TextField(blank=True, default="Xaridingiz uchun rahmat!")
    is_active = models.BooleanField(default=True)

    class Meta(TenantBaseModel.Meta):
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["company", "code"], condition=models.Q(deleted_at__isnull=True),
                                    name="uniq_branch_code")
        ]

    def __str__(self):
        return self.name


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class Device(BranchScopedModel):
    class Mode(models.TextChoices):
        POS = "POS", "Kassa"
        HUB = "HUB", "Asosiy kassa (lokal hub)"
        WAITER = "WAITER", "Ofitsiant"
        KDS = "KDS", "Oshxona ekrani"
        MANAGER = "MANAGER", "Boshqaruv"
        COURIER = "COURIER", "Kuryer"

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, help_text="Hujjat raqami prefiksi, masalan K1")
    mode = models.CharField(max_length=10, choices=Mode.choices)
    is_backup_hub = models.BooleanField(default=False, help_text="Hub o'chsa vazifani oladi")
    token_hash = models.CharField(max_length=64, unique=True, editable=False)
    platform = models.CharField(max_length=20, blank=True)
    app_version = models.CharField(max_length=20, blank=True)
    hardware_id = models.CharField(max_length=128, blank=True)
    local_ip = models.GenericIPAddressField(null=True, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(BranchScopedModel.Meta):
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["company", "code"], condition=models.Q(deleted_at__isnull=True),
                                    name="uniq_device_code")
        ]

    def __str__(self):
        return f"{self.name} ({self.mode})"

    @staticmethod
    def hash_token(raw: str) -> str:
        return _hash_token(raw)

    def issue_token(self) -> str:
        """Yangi token yaratadi; xom token faqat bir marta qaytariladi, bazada sha256 saqlanadi."""
        raw = "dev_" + secrets.token_urlsafe(40)
        self.token_hash = _hash_token(raw)
        return raw

    @property
    def is_pos_like(self):
        return self.mode in (self.Mode.POS, self.Mode.HUB)


class Setting(TenantBaseModel):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    key = models.CharField(max_length=100)
    value = models.JSONField(default=dict)

    class Meta(TenantBaseModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=["company", "branch", "key"], name="uniq_setting_key",
                                    nulls_distinct=False)
        ]


class DocumentCounter(TenantBaseModel):
    """Har qurilma uchun hujjat tartib raqami hisoblagichi."""

    kind = models.CharField(max_length=20)
    year = models.PositiveIntegerField()
    value = models.PositiveIntegerField(default=0)

    class Meta(TenantBaseModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=["company", "device", "kind", "year"], name="uniq_doc_counter")
        ]


__all__ = [
    "BusinessType", "Module", "Plan", "Company", "Subscription", "SubscriptionPayment",
    "Branch", "Device", "Setting", "DocumentCounter", "uuid7",
]
