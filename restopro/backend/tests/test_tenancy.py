from apps.tenancy.models import Branch, Device
from apps.tenancy.services import issue_license_token, verify_license_token
from conftest import auth_client
from tests.factories import make_staff


def _register(client, branch, mode, hw=""):
    return client.post("/api/v1/auth/devices/register/", {
        "branch": str(branch.id), "mode": mode, "name": f"{mode} test", "platform": "windows",
        "hardware_id": hw}, format="json")


def test_device_register_and_use_token(api, owner_client_a, company_a):
    r = _register(owner_client_a, company_a.branch, "KDS")
    assert r.status_code == 201, r.data
    assert r.data["device_code"] == "O1"
    assert r.data["device_token"].startswith("dev_")
    payload = verify_license_token(r.data["license"]["token"])
    assert payload["cid"] == str(company_a.id)
    api.credentials(HTTP_X_DEVICE_TOKEN=r.data["device_token"])
    hb = api.post("/api/v1/tenancy/heartbeat/", {"local_ip": "192.168.1.20"}, format="json")
    assert hb.status_code == 200
    assert hb.data["hub"]["code"] == company_a.device.code


def test_device_limit(owner_client_a, company_a):
    # business tarif: 3 ta kassa (hub allaqachon bitta)
    assert _register(owner_client_a, company_a.branch, "POS").status_code == 201
    assert _register(owner_client_a, company_a.branch, "POS").status_code == 201
    r = _register(owner_client_a, company_a.branch, "POS")
    assert r.status_code == 402 and r.data["error"] == "plan_limit"


def test_same_hardware_reregister_does_not_consume_limit(owner_client_a, company_a):
    first = _register(owner_client_a, company_a.branch, "POS", hw="PC-123")
    second = _register(owner_client_a, company_a.branch, "POS", hw="PC-123")
    assert first.data["device_id"] == second.data["device_id"]
    assert first.data["device_token"] != second.data["device_token"]


def test_new_hub_demotes_old_hub(owner_client_a, company_a):
    r = _register(owner_client_a, company_a.branch, "HUB")
    company_a.device.refresh_from_db()
    assert company_a.device.mode == "POS"
    assert Device.objects.get(pk=r.data["device_id"]).mode == "HUB"


def test_revoked_device_token_rejected(api, owner_client_a, company_a):
    r = owner_client_a.post(f"/api/v1/tenancy/devices/{company_a.device.id}/revoke/")
    assert r.status_code == 200
    api.credentials(HTTP_X_DEVICE_TOKEN=company_a.device_token)
    assert api.get("/api/v1/auth/pin-users/").status_code == 401


def test_cashier_cannot_register_device(company_a):
    cashier = make_staff(company_a, "cashier", pin="2001")
    assert _register(auth_client(cashier), company_a.branch, "POS").status_code == 403


def test_branch_crud_and_limit(owner_client_a, company_a):
    # business tarif: 2 filial
    r = owner_client_a.post("/api/v1/tenancy/branches/", {"name": "Chilonzor", "code": "B2"}, format="json")
    assert r.status_code == 201, r.data
    assert Branch.objects.filter(company_id=company_a.id).count() == 2
    r = owner_client_a.post("/api/v1/tenancy/branches/", {"name": "Yunusobod", "code": "B3"}, format="json")
    assert r.status_code == 402
    dup = owner_client_a.patch(f"/api/v1/tenancy/branches/{company_a.branch.id}/", {"code": "B2"}, format="json")
    assert dup.status_code == 400


def test_manager_sees_only_assigned_branches(owner_client_a, company_a):
    owner_client_a.post("/api/v1/tenancy/branches/", {"name": "Chilonzor", "code": "B2"}, format="json")
    mgr = make_staff(company_a, "manager", pin="1111", phone="+998901116666", password="manager1")
    r = auth_client(mgr).get("/api/v1/tenancy/branches/")
    assert [b["code"] for b in r.data] == ["B1"]


def test_subscription_and_plans(api, owner_client_a):
    assert len(api.get("/api/v1/tenancy/plans/").data) == 3
    r = owner_client_a.get("/api/v1/tenancy/subscription/")
    assert r.data["status"] == "TRIAL" and r.data["days_left"] >= 13


def test_license_token_tamper_detected(company_a):
    import pytest

    tok = issue_license_token(company_a.id)["token"]
    body, sig = tok.split(".")
    with pytest.raises(Exception):
        verify_license_token(body[:-2] + "AA" + "." + sig)


def test_health(api, db):
    assert api.get("/api/v1/health/").data["status"] == "ok"


def test_openapi_schema(api, db):
    r = api.get("/api/schema/")
    assert r.status_code == 200
