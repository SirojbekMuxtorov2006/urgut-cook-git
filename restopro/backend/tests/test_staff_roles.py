from datetime import timedelta

from django.utils import timezone

from apps.accounts.models import AuditLog, User
from apps.tenancy.services import invalidate_access_cache
from conftest import auth_client
from tests.factories import make_staff


def test_owner_creates_pin_employee(owner_client_a, company_a):
    r = owner_client_a.post("/api/v1/auth/employees/", {
        "full_name": "Dilshod", "role": str(company_a.roles["cashier"].id), "pin": "2001",
        "branches": [str(company_a.branch.id)]}, format="json")
    assert r.status_code == 201, r.data
    u = User.objects.get(pk=r.data["id"])
    assert u.check_pin("2001") and r.data["has_pin"]
    assert r.data["branches"] == [str(company_a.branch.id)]
    assert AuditLog.all_objects.filter(action="staff.created", entity_id=str(u.id)).exists()


def test_duplicate_pin_rejected(owner_client_a, company_a):
    make_staff(company_a, "waiter", pin="3001")
    r = owner_client_a.post("/api/v1/auth/employees/", {
        "full_name": "X", "role": str(company_a.roles["waiter"].id), "pin": "3001"}, format="json")
    assert r.status_code == 400


def test_pin_required_for_pin_role(owner_client_a, company_a):
    r = owner_client_a.post("/api/v1/auth/employees/", {
        "full_name": "X", "role": str(company_a.roles["waiter"].id)}, format="json")
    assert r.status_code == 400


def test_password_role_requires_phone(owner_client_a, company_a):
    r = owner_client_a.post("/api/v1/auth/employees/", {
        "full_name": "Omborchi", "role": str(company_a.roles["storekeeper"].id)}, format="json")
    assert r.status_code == 400
    r = owner_client_a.post("/api/v1/auth/employees/", {
        "full_name": "Omborchi", "role": str(company_a.roles["storekeeper"].id), "phone": "+998901113333",
        "password": "ombor123"}, format="json")
    assert r.status_code == 201


def test_waiter_cannot_manage_staff(company_a):
    waiter = make_staff(company_a, "waiter", pin="3001")
    c = auth_client(waiter)
    assert c.get("/api/v1/auth/employees/").status_code == 403
    assert c.get("/api/v1/auth/audit-logs/").status_code == 403
    assert c.get("/api/v1/auth/me/").status_code == 200


def test_custom_role(owner_client_a, company_a):
    r = owner_client_a.post("/api/v1/auth/roles/", {
        "code": "senior_waiter", "name": "Katta ofitsiant", "login_type": "pin",
        "permissions": ["order.create", "order.view_all", "menu.view"]}, format="json")
    assert r.status_code == 201, r.data
    u = make_staff(company_a, "waiter", pin="3003")
    owner_client_a.patch(f"/api/v1/auth/employees/{u.id}/", {"role": r.data["id"]}, format="json")
    u.refresh_from_db()
    assert u.has_perm_code("order.view_all")


def test_system_role_cannot_be_deleted(owner_client_a, company_a):
    r = owner_client_a.delete(f"/api/v1/auth/roles/{company_a.roles['waiter'].id}/")
    assert r.status_code == 400


def test_owner_role_permissions_locked(owner_client_a, company_a):
    r = owner_client_a.patch(f"/api/v1/auth/roles/{company_a.roles['owner'].id}/", {"permissions": []},
                             format="json")
    assert r.status_code == 400


def test_soft_delete_employee(owner_client_a, company_a):
    u = make_staff(company_a, "waiter", pin="3001")
    assert owner_client_a.delete(f"/api/v1/auth/employees/{u.id}/").status_code == 204
    assert not User.objects.filter(pk=u.pk).exists()
    assert User.all_objects.filter(pk=u.pk, is_active=False).exists()
    # PIN bo'shadi — yangi xodimga berish mumkin
    make_staff(company_a, "waiter", pin="3001")


def test_cannot_delete_self_or_owner(owner_client_a, company_a):
    assert owner_client_a.delete(f"/api/v1/auth/employees/{company_a.owner.id}/").status_code == 400


def test_expired_subscription_read_only(owner_client_a, company_a):
    sub = company_a.company.subscription
    sub.ends_at = timezone.now() - timedelta(days=10)
    sub.save()
    invalidate_access_cache(company_a.id)
    assert owner_client_a.get("/api/v1/auth/employees/").status_code == 200
    r = owner_client_a.post("/api/v1/auth/roles/", {"code": "x", "name": "X"}, format="json")
    assert r.status_code == 403
    sub.ends_at = timezone.now() + timedelta(days=1)
    sub.save()
    invalidate_access_cache(company_a.id)
    assert owner_client_a.post("/api/v1/auth/roles/", {"code": "x", "name": "X"}, format="json").status_code == 201


def test_permissions_catalog(owner_client_a):
    r = owner_client_a.get("/api/v1/auth/permissions/")
    assert r.status_code == 200 and len(r.data) >= 30
