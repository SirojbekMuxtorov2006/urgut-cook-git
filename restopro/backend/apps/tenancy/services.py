import base64
import hashlib
import json
from datetime import timedelta

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import BusinessError, PlanLimitExceeded
from apps.tenancy.models import Branch, Company, Device, Plan, Subscription

DEFAULT_PLANS = [
    # code, nomi, narx, filial, kassa, ofitsiant, kds, menejer, kuryer, modullar
    ("start", "Start", 199000, 1, 1, 3, 1, 2, 0, ["inventory"]),
    ("business", "Biznes", 399000, 2, 3, 10, 3, 5, 3, ["inventory", "qr_menu", "delivery", "reports_pro"]),
    ("pro", "Pro", 799000, 10, 20, 50, 10, 20, 20,
     ["inventory", "qr_menu", "delivery", "banquet", "loyalty", "reports_pro"]),
]


def ensure_default_plans():
    for i, (code, name, price, br, pos, waiters, kds, mgr, cour, mods) in enumerate(DEFAULT_PLANS):
        Plan.objects.update_or_create(code=code, defaults=dict(
            name=name, price_monthly=price, max_branches=br, max_pos=pos, max_waiters=waiters, max_kds=kds,
            max_managers=mgr, max_couriers=cour, modules=mods, sort=i))


def current_subscription(company_id) -> Subscription | None:
    return Subscription.objects.select_related("plan").filter(company_id=company_id).order_by("-ends_at").first()


def get_access_level(company_id) -> str:
    key = f"access:{company_id}"
    level = cache.get(key)
    if level is None:
        sub = current_subscription(company_id)
        level = sub.access if sub else Subscription.Access.READ_ONLY
        cache.set(key, level, 60)
    return level


def invalidate_access_cache(company_id):
    cache.delete(f"access:{company_id}")


def start_trial(company: Company, plan_code: str = "business") -> Subscription:
    ensure_default_plans()
    plan = Plan.objects.get(code=plan_code)
    now = timezone.now()
    sub = Subscription.objects.create(company=company, plan=plan, status=Subscription.Status.TRIAL,
                                      starts_at=now, ends_at=now + timedelta(days=settings.TRIAL_DAYS))
    invalidate_access_cache(company.id)
    return sub


def check_branch_limit(company_id):
    sub = current_subscription(company_id)
    if sub is None:
        raise PlanLimitExceeded("Obuna topilmadi")
    if Branch.all_objects.filter(company_id=company_id, deleted_at__isnull=True).count() >= sub.plan.max_branches:
        raise PlanLimitExceeded(f"Tarif bo'yicha filiallar soni: {sub.plan.max_branches}. Tarifni oshiring.")


def check_device_limit(company_id, mode):
    sub = current_subscription(company_id)
    if sub is None:
        raise PlanLimitExceeded("Obuna topilmadi")
    modes = [Device.Mode.POS, Device.Mode.HUB] if mode in (Device.Mode.POS, Device.Mode.HUB) else [mode]
    used = Device.all_objects.filter(company_id=company_id, mode__in=modes, is_active=True,
                                     deleted_at__isnull=True).count()
    limit = sub.plan.device_limit(mode)
    if used >= limit:
        raise PlanLimitExceeded(f"Tarif bo'yicha '{Device.Mode(mode).label}' qurilmalari soni: {limit}.")


def next_device_code(company_id, mode) -> str:
    prefix = {"POS": "K", "HUB": "K", "WAITER": "W", "KDS": "O", "MANAGER": "M", "COURIER": "C"}[mode]
    existing = set(Device.all_objects.filter(company_id=company_id).values_list("code", flat=True))
    n = 1
    while f"{prefix}{n}" in existing:
        n += 1
    return f"{prefix}{n}"


@transaction.atomic
def register_device(*, company_id, branch_id, mode, name, platform="", app_version="", hardware_id="",
                    is_backup_hub=False, user=None) -> tuple[Device, str]:
    branch = Branch.all_objects.filter(pk=branch_id, company_id=company_id, deleted_at__isnull=True).first()
    if branch is None:
        raise BusinessError("Filial topilmadi")
    # Shu kompyuter oldin ro'yxatdan o'tgan bo'lsa — eski yozuv yangilanadi (limit sarflanmaydi)
    device = None
    if hardware_id:
        device = Device.all_objects.filter(company_id=company_id, hardware_id=hardware_id,
                                           deleted_at__isnull=True).first()
    if device is None:
        check_device_limit(company_id, mode)
        device = Device(company_id=company_id, branch=branch, mode=mode, code=next_device_code(company_id, mode),
                        created_by=user)
    if mode == Device.Mode.HUB:
        # Filialda bitta asosiy hub bo'ladi; eskisi oddiy kassaga aylanadi
        Device.all_objects.filter(branch=branch, mode=Device.Mode.HUB).exclude(pk=device.pk).update(
            mode=Device.Mode.POS)
    device.branch = branch
    device.mode = mode
    device.name = name or f"{Device.Mode(mode).label} {device.code}"
    device.platform = platform
    device.app_version = app_version
    device.hardware_id = hardware_id
    device.is_backup_hub = is_backup_hub
    device.is_active = True
    raw = device.issue_token()
    device.save()
    return device, raw


# ---------------- Offline litsenziya tokeni (Ed25519) ----------------

def _private_key() -> Ed25519PrivateKey:
    seed = settings.LICENSE_SIGNING_SEED
    raw = base64.b64decode(seed) if seed else hashlib.sha256(("license:" + settings.SECRET_KEY).encode()).digest()
    return Ed25519PrivateKey.from_private_bytes(raw[:32])


def license_public_key_b64() -> str:
    pub = _private_key().public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return base64.b64encode(pub).decode()


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def issue_license_token(company_id, device: Device | None = None) -> dict:
    """Qurilma internetsiz 7 kungacha ishlashi uchun imzolangan litsenziya.

    Format: base64url(payload_json) + "." + base64url(ed25519_signature)
    """
    sub = current_subscription(company_id)
    now = timezone.now()
    payload = {
        "cid": str(company_id),
        "did": str(device.id) if device else None,
        "plan": sub.plan.code if sub else None,
        "status": sub.compute_status() if sub else "EXPIRED",
        "access": sub.access if sub else "read_only",
        "modules": sub.plan.modules if sub else [],
        "sub_ends": int(sub.ends_at.timestamp()) if sub else 0,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=settings.LICENSE_OFFLINE_DAYS)).timestamp()),
    }
    body = _b64url(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = _b64url(_private_key().sign(body.encode()))
    return {"token": f"{body}.{sig}", "public_key": license_public_key_b64(), "payload": payload}


def verify_license_token(token: str) -> dict:
    body, sig = token.split(".")
    pad = lambda s: s + "=" * (-len(s) % 4)  # noqa: E731
    _private_key().public_key().verify(base64.urlsafe_b64decode(pad(sig)), body.encode())
    payload = json.loads(base64.urlsafe_b64decode(pad(body)))
    if payload["exp"] < int(timezone.now().timestamp()):
        raise ValueError("Litsenziya muddati tugagan")
    return payload


@transaction.atomic
def purge_company(company: Company):
    """Kompaniyani butunlay o'chirish (faqat demo/test uchun; mijoz ma'lumoti odatda o'chirilmaydi)."""
    from apps.accounts.models import User
    from apps.inventory.models import TechCard, TechCardItem
    from apps.menu.models import MenuItem

    TechCardItem.all_objects.filter(company=company).delete()
    TechCard.all_objects.filter(company=company).delete()
    MenuItem.all_objects.filter(company=company).delete()
    User.all_objects.filter(company=company).delete()
    company.delete()
