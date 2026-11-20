import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts import audit
from apps.accounts.catalog import SYSTEM_ROLES
from apps.accounts.models import Permission, Role, SmsCode, User, UserBranch, pin_digest
from apps.core import context
from apps.core.exceptions import BusinessError
from integrations.sms import get_sms_provider

PHONE_RE = re.compile(r"^\+998\d{9}$")


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 9:
        digits = "998" + digits
    phone = "+" + digits
    if not PHONE_RE.match(phone):
        raise ValidationError({"phone": "Telefon raqam formati: +998XXXXXXXXX"})
    return phone


# ---------------- Rollar ----------------

def create_system_roles(company) -> dict[str, Role]:
    from apps.accounts.catalog import ensure_permissions

    ensure_permissions()
    roles = {}
    with context.tenant_context(company.id):
        for code, (name, login_type, discount, perms) in SYSTEM_ROLES.items():
            role = Role.objects.create(
                company=company, code=code, name=name, is_system=True, login_type=login_type,
                all_permissions=perms == ["*"], discount_limit_percent=discount,
                own_tables_only=code == "waiter")
            if perms != ["*"]:
                role.permissions.set(Permission.objects.filter(code__in=perms))
            roles[code] = role
    return roles


# ---------------- SMS ----------------

def send_sms_code(phone: str, purpose: str) -> SmsCode:
    phone = normalize_phone(phone)
    exists = User.objects.filter(phone=phone).exists()
    if purpose == SmsCode.Purpose.REGISTER and exists:
        raise BusinessError("Bu raqam allaqachon ro'yxatdan o'tgan. Tizimga kiring.", code="phone_exists")
    if purpose == SmsCode.Purpose.RESET_PASSWORD and not exists:
        raise BusinessError("Bu raqam bilan foydalanuvchi topilmadi", code="not_found")
    recent = SmsCode.objects.filter(phone=phone, created_at__gte=timezone.now() - timedelta(seconds=60)).exists()
    if recent:
        raise BusinessError("Kodni qayta yuborish uchun 1 daqiqa kuting", code="too_soon")
    code = f"{secrets.randbelow(10**6):06d}"
    sms = SmsCode.objects.create(
        phone=phone, purpose=purpose, code_hash=make_password(code),
        expires_at=timezone.now() + timedelta(seconds=settings.SMS_CODE_TTL_SECONDS))
    get_sms_provider().send(phone, f"RestoPro tasdiqlash kodi: {code}. Hech kimga bermang.")
    return sms


def verify_sms_code(phone: str, code: str, purpose: str) -> SmsCode:
    phone = normalize_phone(phone)
    sms = (SmsCode.objects.filter(phone=phone, purpose=purpose, used_at__isnull=True,
                                  expires_at__gt=timezone.now()).order_by("-created_at").first())
    if sms is None:
        raise ValidationError({"code": "Kod topilmadi yoki muddati tugagan"})
    if sms.attempts >= settings.SMS_CODE_MAX_ATTEMPTS:
        raise ValidationError({"code": "Urinishlar soni tugadi. Yangi kod so'rang."})
    if not check_password(code, sms.code_hash):
        SmsCode.objects.filter(pk=sms.pk).update(attempts=sms.attempts + 1)
        raise ValidationError({"code": "Kod noto'g'ri"})
    sms.used_at = timezone.now()
    sms.save(update_fields=["used_at"])
    return sms


# ---------------- Tokenlar ----------------

def issue_tokens(user: User, device=None, branch_id=None) -> dict:
    refresh = RefreshToken.for_user(user)
    claims = {
        "company_id": str(user.company_id) if user.company_id else None,
        "role": user.role.code if user.role_id else None,
        "device_id": str(device.id) if device else None,
        "branch_id": str(branch_id) if branch_id else None,
    }
    for k, v in claims.items():
        refresh[k] = v
    access = refresh.access_token
    for k, v in claims.items():
        access[k] = v
    return {"access": str(access), "refresh": str(refresh)}


def user_payload(user: User) -> dict:
    from apps.accounts.serializers import MeSerializer

    return MeSerializer(user).data


# ---------------- Ro'yxatdan o'tish ----------------

def register_company(*, phone, code, company_name, business_type, full_name, password, language="uz") -> User:
    phone = normalize_phone(phone)
    # Kod tekshiruvi tranzaksiyadan tashqarida: xato urinishlar hisoblagichi qaytarib yuborilmasin
    verify_sms_code(phone, code, SmsCode.Purpose.REGISTER)
    if User.all_objects.filter(phone=phone).exists():
        raise BusinessError("Bu raqam allaqachon ro'yxatdan o'tgan", code="phone_exists")
    return _create_company(phone=phone, company_name=company_name, business_type=business_type,
                           full_name=full_name, password=password, language=language)


@transaction.atomic
def _create_company(*, phone, company_name, business_type, full_name, password, language) -> User:
    from apps.tenancy.models import Branch, Company
    from apps.tenancy.onboarding import apply_template
    from apps.tenancy.services import start_trial

    company = Company.objects.create(name=company_name, business_type=business_type, phone=phone, language=language)
    start_trial(company)
    roles = create_system_roles(company)
    with context.tenant_context(company.id):
        branch = Branch.objects.create(company=company, name="Asosiy filial", code="B1", phone=phone,
                                       service_charge_percent=10 if business_type in ("RESTAURANT", "NATIONAL") else 0)
        owner = User.objects.create_user(phone=phone, password=password, company=company, full_name=full_name,
                                         role=roles["owner"], language=language)
        UserBranch.objects.create(company=company, branch=branch, user=owner)
        apply_template(company, branch, business_type)
        audit.log("company.registered", entity="Company", entity_id=company.id, company_id=company.id,
                  user=owner, new={"name": company_name, "business_type": business_type})
    return owner


def reset_password(*, phone, code, new_password) -> User:
    phone = normalize_phone(phone)
    verify_sms_code(phone, code, SmsCode.Purpose.RESET_PASSWORD)
    user = User.objects.get(phone=phone)
    user.set_password(new_password)
    user.save(update_fields=["password"])
    audit.log("user.password_reset", entity="User", entity_id=user.id, company_id=user.company_id, user=user)
    return user


# ---------------- Login ----------------

def password_login(phone: str, password: str) -> User:
    phone = normalize_phone(phone)
    user = User.objects.select_related("role", "company").filter(phone=phone, is_active=True).first()
    if user is None or not user.check_password(password):
        raise AuthenticationFailed("Telefon yoki parol noto'g'ri")
    if user.company and user.company.status != user.company.Status.ACTIVE:
        raise AuthenticationFailed("Kompaniya bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling.")
    if user.role_id and user.role.login_type == Role.LoginType.PIN and not user.is_owner:
        raise AuthenticationFailed("Bu xodim faqat PIN orqali kassada kiradi")
    return user


def pin_login(device, pin: str, user_id=None) -> User:
    """Qurilmada 4 xonali PIN bilan kirish. 5 marta xato — 5 daqiqa blok.

    Xato hisoblagichi alohida tranzaksiyada saqlanadi, istisno uni qaytarib yubormasligi uchun.
    """
    if not re.fullmatch(r"\d{4}", pin or ""):
        raise ValidationError({"pin": "PIN 4 ta raqamdan iborat"})
    error = None
    with transaction.atomic():
        qs = User.objects.select_for_update(of=("self",)).select_related("role").filter(
            company_id=device.company_id, is_active=True)
        if user_id:
            user = qs.filter(pk=user_id).first()
        else:
            user = qs.filter(pin_lookup=pin_digest(device.company_id, pin)).first()
        if user is None:
            error = "PIN noto'g'ri"
        elif user.pin_locked:
            error = "Juda ko'p xato urinish. 5 daqiqadan keyin qayta urinib ko'ring."
        elif not user.check_pin(pin):
            user.pin_fail_count += 1
            if user.pin_fail_count >= settings.PIN_MAX_FAILS:
                user.pin_locked_until = timezone.now() + timedelta(seconds=settings.PIN_LOCK_SECONDS)
                user.pin_fail_count = 0
            user.save(update_fields=["pin_fail_count", "pin_locked_until"])
            error = "PIN noto'g'ri"
        elif not user.can_access_branch(device.branch_id):
            error = "Bu filialda ishlashga ruxsat yo'q"
        elif user.pin_fail_count:
            user.pin_fail_count = 0
            user.save(update_fields=["pin_fail_count"])
    if error:
        audit.log("auth.pin_failed", company_id=device.company_id, branch_id=device.branch_id, severity="WARNING",
                  user=user, new={"device": device.code, "reason": error})
        raise AuthenticationFailed(error)
    audit.log("auth.pin_login", entity="User", entity_id=user.id, company_id=device.company_id,
              branch_id=device.branch_id, user=user, new={"device": device.code})
    return user


def verify_manager_pin(company_id, pin: str, permission: str) -> User:
    """Menejer PIN tasdig'i (bekor qilish, qaytarish va h.k. uchun)."""
    user = User.objects.select_related("role").filter(
        company_id=company_id, pin_lookup=pin_digest(company_id, pin), is_active=True).first()
    if user is None or not user.check_pin(pin) or not user.has_perm_code(permission):
        raise AuthenticationFailed("Menejer PIN noto'g'ri yoki huquq yetarli emas")
    return user
