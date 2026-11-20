"""A kompaniya B kompaniya ma'lumotlarini hech qanday endpoint orqali ko'ra olmaydi."""
import pytest

from apps.accounts.models import AuditLog, Role
from conftest import auth_client
from tests.factories import make_staff

LIST_ENDPOINTS = [
    "/api/v1/tenancy/branches/",
    "/api/v1/tenancy/devices/",
    "/api/v1/tenancy/settings/",
    "/api/v1/auth/roles/",
    "/api/v1/auth/employees/",
    "/api/v1/auth/audit-logs/",
]


def _ids(resp):
    data = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
    return {str(x["id"]) for x in data}


@pytest.mark.parametrize("url", LIST_ENDPOINTS)
def test_list_endpoints_do_not_leak(url, company_a, company_b, owner_client_a, owner_client_b):
    AuditLog.all_objects.create(company=company_b.company, action="secret.b")
    ra = owner_client_a.get(url)
    rb = owner_client_b.get(url)
    assert ra.status_code == 200 and rb.status_code == 200
    assert _ids(ra).isdisjoint(_ids(rb))


def test_retrieve_other_company_objects_404(company_a, company_b, owner_client_a):
    urls = [
        f"/api/v1/tenancy/branches/{company_b.branch.id}/",
        f"/api/v1/tenancy/devices/{company_b.device.id}/",
        f"/api/v1/auth/roles/{company_b.roles['cashier'].id}/",
        f"/api/v1/auth/employees/{company_b.owner.id}/",
    ]
    for url in urls:
        assert owner_client_a.get(url).status_code == 404, url
        assert owner_client_a.patch(url, {"name": "hack"}, format="json").status_code == 404, url
        assert owner_client_a.delete(url).status_code == 404, url


def test_cannot_assign_other_company_role(company_a, company_b, owner_client_a):
    r = owner_client_a.post("/api/v1/auth/employees/", {
        "full_name": "Hack", "role": str(company_b.roles["waiter"].id), "pin": "7777"}, format="json")
    assert r.status_code == 400
    assert "role" in r.data["detail"]


def test_cannot_use_other_company_branch_header(company_a, company_b):
    c = auth_client(company_a.owner, company_b.branch)
    # ega barcha filiallarga ruxsatli, lekin B filiali uning kompaniyasida yo'q — ma'lumot bo'sh bo'lishi kerak
    r = c.get("/api/v1/tenancy/devices/")
    assert all(d["branch"] != str(company_b.branch.id) for d in r.data)


def test_manager_branch_header_denied_for_foreign_branch(company_a, company_b):
    mgr = make_staff(company_a, "manager", pin="1212", phone="+998901117777", password="manager1")
    c = auth_client(mgr, company_b.branch)
    assert c.get("/api/v1/auth/me/").status_code == 403


def test_device_token_scoped_to_company(api, company_a, company_b):
    make_staff(company_b, "waiter", pin="3001")
    api.credentials(HTTP_X_DEVICE_TOKEN=company_a.device_token)
    assert api.post("/api/v1/auth/pin-login/", {"pin": "3001"}, format="json").status_code == 401
    users = api.get("/api/v1/auth/pin-users/").data
    assert all(u["full_name"] != "Xodim" for u in users)


def test_company_endpoint_returns_own(owner_client_a, company_a, company_b):
    r = owner_client_a.get("/api/v1/tenancy/company/")
    assert r.data["id"] == str(company_a.id)


def test_created_object_ignores_foreign_company_id(owner_client_a, company_a, company_b):
    r = owner_client_a.post("/api/v1/auth/roles/", {"code": "hostess", "name": "Hostes",
                                                    "company": str(company_b.id)}, format="json")
    assert r.status_code == 201
    assert Role.all_objects.get(pk=r.data["id"]).company_id == company_a.id
