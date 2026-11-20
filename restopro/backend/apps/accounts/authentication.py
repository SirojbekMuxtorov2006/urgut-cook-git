from django.utils import timezone
from rest_framework import authentication, exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.core import context


def _apply_branch(request, user, device):
    """X-Branch-ID sarlavhasi (yoki qurilma filiali) bo'yicha filial kontekstini o'rnatadi."""
    branch_id = request.headers.get("X-Branch-ID") or (device.branch_id if device else None)
    if branch_id:
        if user is not None and not user.can_access_branch(branch_id):
            raise exceptions.PermissionDenied("Bu filialga ruxsat yo'q")
        if device is not None and str(device.branch_id) != str(branch_id):
            raise exceptions.PermissionDenied("Qurilma boshqa filialga biriktirilgan")
    return branch_id


class TenantJWTAuthentication(JWTAuthentication):
    """JWT + tenant konteksti. Token ichida device_id bo'lsa qurilma ham tekshiriladi."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        if user.deleted_at is not None:
            raise exceptions.AuthenticationFailed("Foydalanuvchi o'chirilgan")

        device = None
        device_id = token.get("device_id")
        if device_id:
            from apps.tenancy.models import Device

            device = Device.all_objects.filter(pk=device_id, is_active=True, deleted_at__isnull=True).first()
            if device is None:
                raise exceptions.AuthenticationFailed("Qurilma faol emas")

        company_id = user.company_id
        impersonating = None
        if user.is_superuser and request.headers.get("X-Company-ID"):
            company_id = request.headers["X-Company-ID"]
            impersonating = user
        if company_id is None and not user.is_superuser:
            raise exceptions.AuthenticationFailed("Foydalanuvchi kompaniyaga biriktirilmagan")

        context.set_tenant(company_id, None, user.id, device.id if device else None)
        request.company_id = company_id
        request.device = device
        request.impersonated_by = impersonating
        branch_id = _apply_branch(request, user if not impersonating else None, device)
        context.set_tenant(company_id, branch_id, user.id, device.id if device else None)
        request.branch_id = branch_id
        return user, token


class DeviceUser:
    """Qurilma tokeni bilan kirilganda (PIN kiritilgunga qadar) request.user o'rnida."""

    is_authenticated = True
    is_anonymous = False
    is_superuser = False
    is_staff = False
    is_device = True

    def __init__(self, device):
        self.device = device
        self.id = None
        self.pk = None
        self.company_id = device.company_id
        self.role = None

    def has_perm_code(self, code):
        return False

    def get_permission_codes(self):
        return set()

    def can_access_branch(self, branch_id):
        return str(branch_id) == str(self.device.branch_id)

    def __str__(self):
        return f"device:{self.device.code}"


class DeviceTokenAuthentication(authentication.BaseAuthentication):
    """'X-Device-Token' sarlavhasi orqali qurilmani aniqlash (PIN login, sinxron, bootstrap)."""

    def authenticate(self, request):
        raw = request.headers.get("X-Device-Token")
        if not raw:
            return None
        from apps.tenancy.models import Device

        device = (
            Device.all_objects.select_related("company", "branch")
            .filter(token_hash=Device.hash_token(raw), is_active=True, deleted_at__isnull=True)
            .first()
        )
        if device is None:
            raise exceptions.AuthenticationFailed("Noto'g'ri yoki faol bo'lmagan qurilma tokeni")
        if device.company.status != device.company.Status.ACTIVE:
            raise exceptions.AuthenticationFailed("Kompaniya bloklangan")
        now = timezone.now()
        if not device.last_seen_at or (now - device.last_seen_at).total_seconds() > 60:
            type(device).all_objects.filter(pk=device.pk).update(last_seen_at=now)
        context.set_tenant(device.company_id, device.branch_id, None, device.id)
        request.company_id = device.company_id
        request.branch_id = device.branch_id
        request.device = device
        return DeviceUser(device), None

    def authenticate_header(self, request):
        return "Device"


class PublicAuthentication(authentication.BaseAuthentication):
    """Ochiq endpointlar: hech kimni aniqlamaydi, lekin xatoda 401 qaytishi uchun sarlavha beradi."""

    def authenticate(self, request):
        return None

    def authenticate_header(self, request):
        return "Bearer"
