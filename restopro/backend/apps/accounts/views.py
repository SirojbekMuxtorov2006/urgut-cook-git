from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts import audit, services
from apps.accounts.authentication import PublicAuthentication
from apps.accounts.models import AuditLog, Permission, Role, SmsCode, User
from apps.accounts.permissions import DEFAULT_PERMS, IsDevice, IsUser
from apps.accounts.serializers import (
    AuditLogSerializer, AuthResponseSerializer, DeviceRegisterResponseSerializer, DeviceRegisterSerializer,
    EmployeeSerializer, LoginSerializer, ManagerPinSerializer, MeSerializer, PermissionSerializer,
    PinLoginSerializer, RegisterSerializer, ResetPasswordSerializer, RoleSerializer, SendCodeSerializer,
)
from apps.accounts.throttles import LoginThrottle, PinThrottle, SmsThrottle
from apps.core.exceptions import BusinessError
from apps.core.viewsets import TenantModelViewSet, TenantViewSetMixin
from apps.tenancy import services as tenancy_services


def _auth_response(user, device=None, branch_id=None, code=status.HTTP_200_OK):
    data = services.issue_tokens(user, device=device, branch_id=branch_id)
    data["user"] = MeSerializer(user).data
    return Response(data, status=code)


class SendRegisterCodeView(APIView):
    """1-qadam: telefon raqamga SMS kod yuborish."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]
    throttle_classes = [SmsThrottle]

    @extend_schema(request=SendCodeSerializer, responses={200: dict})
    def post(self, request):
        s = SendCodeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        services.send_sms_code(s.validated_data["phone"], SmsCode.Purpose.REGISTER)
        return Response({"sent": True, "ttl": 300})


class RegisterView(APIView):
    """2-qadam: SMS kodni tasdiqlash + kompaniya, filial, ega va shablon yaratish."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]
    throttle_classes = [LoginThrottle]

    @extend_schema(request=RegisterSerializer, responses={201: AuthResponseSerializer})
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = services.register_company(**s.validated_data)
        return _auth_response(user, code=status.HTTP_201_CREATED)


class SendResetCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]
    throttle_classes = [SmsThrottle]

    @extend_schema(request=SendCodeSerializer, responses={200: dict})
    def post(self, request):
        s = SendCodeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        services.send_sms_code(s.validated_data["phone"], SmsCode.Purpose.RESET_PASSWORD)
        return Response({"sent": True, "ttl": 300})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]
    throttle_classes = [LoginThrottle]

    @extend_schema(request=ResetPasswordSerializer, responses={200: AuthResponseSerializer})
    def post(self, request):
        s = ResetPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return _auth_response(services.reset_password(**s.validated_data))


class LoginView(APIView):
    """Telefon + parol (ega, menejer, omborchi, buxgalter)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]
    throttle_classes = [LoginThrottle]

    @extend_schema(request=LoginSerializer, responses={200: AuthResponseSerializer})
    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = services.password_login(**s.validated_data)
        audit.log("auth.login", entity="User", entity_id=user.id, company_id=user.company_id, user=user,
                  request=request)
        return _auth_response(user)


class PinLoginView(APIView):
    """Kassa/ofitsiant qurilmasida PIN bilan kirish. X-Device-Token sarlavhasi shart."""

    permission_classes = [IsDevice]
    throttle_classes = [PinThrottle]

    @extend_schema(request=PinLoginSerializer, responses={200: AuthResponseSerializer})
    def post(self, request):
        s = PinLoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = services.pin_login(request.device, s.validated_data["pin"], s.validated_data.get("user_id"))
        return _auth_response(user, device=request.device, branch_id=request.device.branch_id)


class PinUsersView(APIView):
    """Qurilma ekranida ko'rsatish uchun PIN bilan kiradigan xodimlar ro'yxati (ism, rol)."""

    permission_classes = [IsDevice]

    @extend_schema(responses={200: dict})
    def get(self, request):
        device = request.device
        users = (User.objects.filter(company_id=device.company_id, is_active=True)
                 .exclude(pin_hash="").select_related("role")
                 .filter(Q(role__all_permissions=True) | Q(user_branches__branch_id=device.branch_id,
                                                           user_branches__deleted_at__isnull=True))
                 .distinct().order_by("full_name"))
        return Response([{"id": str(u.id), "full_name": u.full_name, "role": u.role.name if u.role else None,
                          "role_code": u.role.code if u.role else None} for u in users])


class VerifyManagerPinView(APIView):
    """Menejer PIN tasdig'i (oshxonaga yuborilganni bekor qilish, qaytarish va h.k.)."""

    permission_classes = [IsUser]
    throttle_classes = [PinThrottle]

    @extend_schema(request=ManagerPinSerializer, responses={200: dict})
    def post(self, request):
        s = ManagerPinSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        manager = services.verify_manager_pin(request.company_id, s.validated_data["pin"],
                                              s.validated_data["permission"])
        return Response({"approved": True, "manager_id": str(manager.id), "manager_name": manager.full_name})


class RefreshView(TokenRefreshView):
    authentication_classes = [PublicAuthentication]
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [IsUser]

    @extend_schema(request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
                   responses={204: None})
    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken

        try:
            RefreshToken(request.data.get("refresh")).blacklist()
        except Exception:  # noqa: BLE001 — token allaqachon yaroqsiz bo'lsa ham chiqish muvaffaqiyatli
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsUser]

    @extend_schema(responses=MeSerializer)
    def get(self, request):
        return Response(MeSerializer(request.user).data)

    @extend_schema(request=MeSerializer, responses=MeSerializer)
    def patch(self, request):
        s = MeSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)


class DeviceRegisterView(APIView):
    """Qurilmani ro'yxatdan o'tkazish: ega/menejer bir marta telefon+parol bilan kiradi,
    qurilma rejimi tanlanadi va doimiy qurilma tokeni beriladi."""

    permission_classes = DEFAULT_PERMS
    required_perms = {"post": "device.manage"}

    @extend_schema(request=DeviceRegisterSerializer, responses={201: DeviceRegisterResponseSerializer})
    def post(self, request):
        s = DeviceRegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        if not request.user.can_access_branch(d["branch"]):
            raise BusinessError("Bu filialga ruxsat yo'q")
        device, raw = tenancy_services.register_device(
            company_id=request.company_id, branch_id=d["branch"], mode=d["mode"], name=d.get("name", ""),
            platform=d.get("platform", ""), app_version=d.get("app_version", ""),
            hardware_id=d.get("hardware_id", ""), is_backup_hub=d["is_backup_hub"], user=request.user)
        audit.log("device.registered", entity="Device", entity_id=device.id, request=request,
                  branch_id=device.branch_id, new={"code": device.code, "mode": device.mode})
        return Response({
            "device_id": device.id, "device_code": device.code, "device_token": raw, "mode": device.mode,
            "branch": {"id": device.branch.id, "name": device.branch.name, "code": device.branch.code},
            "license": tenancy_services.issue_license_token(request.company_id, device),
        }, status=status.HTTP_201_CREATED)


class PermissionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsUser]
    pagination_class = None


class RoleViewSet(TenantModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = DEFAULT_PERMS
    required_perms = {"list": "staff.view", "retrieve": "staff.view", "*": "role.manage"}
    pagination_class = None

    def get_queryset(self):
        return super().get_queryset().annotate(
            users_count=Count("users", filter=Q(users__deleted_at__isnull=True))).order_by("created_at")

    def perform_update(self, serializer):
        old = audit.snapshot(serializer.instance)
        super().perform_update(serializer)
        audit.log("role.updated", entity="Role", entity_id=serializer.instance.id, old=old,
                  new=audit.snapshot(serializer.instance), request=self.request, severity="WARNING")

    def perform_destroy(self, instance):
        if instance.is_system:
            raise BusinessError("Tizim rolini o'chirib bo'lmaydi")
        if instance.users.filter(deleted_at__isnull=True).exists():
            raise BusinessError("Rolda xodimlar bor. Avval ularni boshqa rolga o'tkazing.")
        instance.delete()


class EmployeeViewSet(TenantModelViewSet):
    queryset = User.objects.select_related("role").all()
    serializer_class = EmployeeSerializer
    permission_classes = DEFAULT_PERMS
    required_perms = {"list": "staff.view", "retrieve": "staff.view", "*": "staff.manage"}
    filterset_fields = ("role", "is_active")
    search_fields = ("full_name", "phone")
    ordering = ("full_name",)
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        branch = self.request.query_params.get("branch")
        if branch:
            qs = qs.filter(user_branches__branch_id=branch, user_branches__deleted_at__isnull=True)
        return qs

    def perform_create(self, serializer):
        user = serializer.save(company_id=self.request.company_id)
        audit.log("staff.created", entity="User", entity_id=user.id, request=self.request,
                  new=audit.snapshot(user, ["full_name", "phone", "role"]))

    def perform_update(self, serializer):
        user = serializer.instance
        if user.is_owner and not self.request.user.is_owner:
            raise BusinessError("Ega ma'lumotini faqat ega o'zgartiradi")
        old = audit.snapshot(user, ["full_name", "phone", "role", "is_active"])
        pin_changed = bool(serializer.validated_data.get("pin"))
        serializer.save()
        audit.log("staff.updated", entity="User", entity_id=user.id, request=self.request, old=old,
                  new={**audit.snapshot(user, ["full_name", "phone", "role", "is_active"]),
                       "pin_changed": pin_changed})

    def perform_destroy(self, user):
        if user.pk == self.request.user.pk:
            raise BusinessError("O'zingizni o'chira olmaysiz")
        if user.is_owner:
            raise BusinessError("Egani o'chirib bo'lmaydi")
        user.is_active = False
        user.deleted_at = timezone.now()
        user.pin_lookup = ""
        user.phone = None
        user.save(update_fields=["is_active", "deleted_at", "pin_lookup", "phone"])
        audit.log("staff.deleted", entity="User", entity_id=user.id, request=self.request, severity="WARNING")


class AuditLogViewSet(TenantViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user", "device").all()
    serializer_class = AuditLogSerializer
    permission_classes = DEFAULT_PERMS
    required_perms = {"*": "audit.view"}
    filterset_fields = ("action", "severity", "user", "device", "branch", "entity")
