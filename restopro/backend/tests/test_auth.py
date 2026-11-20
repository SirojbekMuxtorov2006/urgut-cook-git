import pytest
from django.utils import timezone

from apps.accounts.models import AuditLog, Role, SmsCode, User
from apps.core import context
from apps.menu.models import MenuItem
from apps.tenancy.models import Branch, Company
from integrations.sms.console import OUTBOX
from tests.factories import make_staff

REG = "/api/v1/auth/register/"


def _last_code(phone):
    for p, text in reversed(OUTBOX):
        if p == phone:
            return text.split(": ")[1][:6]
    raise AssertionError("SMS topilmadi")


@pytest.mark.django_db
def test_full_registration_flow(api):
    phone = "+998935550011"
    r = api.post("/api/v1/auth/register/send-code/", {"phone": "93 555 00 11"}, format="json")
    assert r.status_code == 200, r.data
    code = _last_code(phone)
    r = api.post(REG, {"phone": phone, "code": code, "company_name": "Choyxona Navro'z",
                       "business_type": "NATIONAL", "full_name": "Anvar", "password": "parol123"}, format="json")
    assert r.status_code == 201, r.data
    assert r.data["access"] and r.data["refresh"]
    assert r.data["user"]["role"]["code"] == "owner"
    company = Company.objects.get(name="Choyxona Navro'z")
    assert Role.all_objects.filter(company=company).count() == 8
    assert MenuItem.all_objects.filter(company=company).count() == 40
    assert Branch.all_objects.filter(company=company).count() == 1
    assert company.subscription.status == "TRIAL"
    assert AuditLog.all_objects.filter(company=company, action="company.registered").exists()

    # o'sha raqam bilan qayta ro'yxatdan o'tib bo'lmaydi
    r = api.post("/api/v1/auth/register/send-code/", {"phone": phone}, format="json")
    assert r.status_code == 400
    assert r.data["error"] == "phone_exists"


@pytest.mark.django_db
def test_wrong_sms_code_limited_attempts(api, settings):
    phone = "+998935550022"
    api.post("/api/v1/auth/register/send-code/", {"phone": phone}, format="json")
    payload = {"phone": phone, "code": "000000", "company_name": "X", "business_type": "CAFE", "full_name": "Y",
               "password": "parol123"}
    real = _last_code(phone)
    if real == "000000":
        payload["code"] = "111111"
    for _ in range(settings.SMS_CODE_MAX_ATTEMPTS):
        assert api.post(REG, payload, format="json").status_code == 400
    payload["code"] = real
    r = api.post(REG, payload, format="json")
    assert r.status_code == 400  # urinishlar tugagan
    assert not Company.objects.filter(phone=phone).exists()


@pytest.mark.django_db
def test_sms_resend_too_soon(api):
    phone = "+998935550033"
    assert api.post("/api/v1/auth/register/send-code/", {"phone": phone}, format="json").status_code == 200
    r = api.post("/api/v1/auth/register/send-code/", {"phone": phone}, format="json")
    assert r.status_code == 400 and r.data["error"] == "too_soon"


@pytest.mark.django_db
def test_invalid_phone(api):
    r = api.post("/api/v1/auth/register/send-code/", {"phone": "12345"}, format="json")
    assert r.status_code == 400


def test_password_login_and_me(api, company_a):
    r = api.post("/api/v1/auth/login/", {"phone": "+998901110001", "password": "secret123"}, format="json")
    assert r.status_code == 200, r.data
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    me = api.get("/api/v1/auth/me/")
    assert me.status_code == 200
    assert me.data["company"]["name"] == "A oshxona"
    assert "staff.manage" in me.data["permissions"]
    assert len(me.data["branches"]) == 1


def test_wrong_password(api, company_a):
    r = api.post("/api/v1/auth/login/", {"phone": "+998901110001", "password": "nope"}, format="json")
    assert r.status_code == 401


def test_pin_role_cannot_password_login(api, company_a):
    make_staff(company_a, "cashier", pin="5555", phone="+998901119999", password="kassir123")
    r = api.post("/api/v1/auth/login/", {"phone": "+998901119999", "password": "kassir123"}, format="json")
    assert r.status_code == 401


def test_refresh_rotation(api, company_a):
    r = api.post("/api/v1/auth/login/", {"phone": "+998901110001", "password": "secret123"}, format="json")
    refresh = r.data["refresh"]
    r2 = api.post("/api/v1/auth/refresh/", {"refresh": refresh}, format="json")
    assert r2.status_code == 200 and r2.data["refresh"] != refresh
    # eski refresh token qora ro'yxatda
    assert api.post("/api/v1/auth/refresh/", {"refresh": refresh}, format="json").status_code == 401


def test_logout_blacklists_refresh(api, company_a):
    r = api.post("/api/v1/auth/login/", {"phone": "+998901110001", "password": "secret123"}, format="json")
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    assert api.post("/api/v1/auth/logout/", {"refresh": r.data["refresh"]}, format="json").status_code == 204
    assert api.post("/api/v1/auth/refresh/", {"refresh": r.data["refresh"]}, format="json").status_code == 401


def test_pin_login_flow(api, company_a):
    waiter = make_staff(company_a, "waiter", "Aziz", pin="3001")
    api.credentials(HTTP_X_DEVICE_TOKEN=company_a.device_token)
    users = api.get("/api/v1/auth/pin-users/")
    assert users.status_code == 200
    assert any(u["full_name"] == "Aziz" for u in users.data)

    r = api.post("/api/v1/auth/pin-login/", {"pin": "3001"}, format="json")
    assert r.status_code == 200, r.data
    assert r.data["user"]["id"] == str(waiter.id)
    assert r.data["user"]["role"]["code"] == "waiter"

    # PIN login tokeni bilan me ishlaydi va qurilma konteksti bor
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    assert api.get("/api/v1/auth/me/").status_code == 200


def test_pin_login_requires_device(api, company_a):
    make_staff(company_a, "waiter", pin="3001")
    assert api.post("/api/v1/auth/pin-login/", {"pin": "3001"}, format="json").status_code in (401, 403)


def test_pin_lockout_after_failures(api, company_a, settings):
    u = make_staff(company_a, "cashier", pin="2001")
    api.credentials(HTTP_X_DEVICE_TOKEN=company_a.device_token)
    for _ in range(settings.PIN_MAX_FAILS):
        r = api.post("/api/v1/auth/pin-login/", {"pin": "9999", "user_id": str(u.id)}, format="json")
        assert r.status_code == 401
    u.refresh_from_db()
    assert u.pin_locked
    # to'g'ri PIN ham blok vaqtida ishlamaydi
    r = api.post("/api/v1/auth/pin-login/", {"pin": "2001", "user_id": str(u.id)}, format="json")
    assert r.status_code == 401
    u.pin_locked_until = timezone.now()
    u.save()
    assert api.post("/api/v1/auth/pin-login/", {"pin": "2001"}, format="json").status_code == 200


def test_pin_login_other_branch_denied(api, company_a):
    with context.tenant_context(company_a.id):
        other = Branch.objects.create(name="Ikkinchi", code="B2")
    make_staff(company_a, "waiter", pin="3002", branch=other)
    api.credentials(HTTP_X_DEVICE_TOKEN=company_a.device_token)
    assert api.post("/api/v1/auth/pin-login/", {"pin": "3002"}, format="json").status_code == 401


def test_manager_pin_verification(company_a):
    from conftest import auth_client

    make_staff(company_a, "manager", "Menejer", pin="1111", phone="+998901118888", password="manager1")
    cashier = make_staff(company_a, "cashier", "Kassir", pin="2001")
    c = auth_client(cashier)
    ok = c.post("/api/v1/auth/manager-pin/", {"pin": "1111", "permission": "order.void_sent"}, format="json")
    assert ok.status_code == 200 and ok.data["approved"]
    bad = c.post("/api/v1/auth/manager-pin/", {"pin": "2001", "permission": "order.void_sent"}, format="json")
    assert bad.status_code == 401  # kassirda bu huquq yo'q


def test_password_reset(api, company_a):
    phone = "+998901110001"
    assert api.post("/api/v1/auth/password/send-code/", {"phone": phone}, format="json").status_code == 200
    r = api.post("/api/v1/auth/password/reset/", {"phone": phone, "code": _last_code(phone),
                                                  "new_password": "yangi123"}, format="json")
    assert r.status_code == 200
    assert User.objects.get(phone=phone).check_password("yangi123")
    assert SmsCode.objects.filter(phone=phone, used_at__isnull=False).exists()
