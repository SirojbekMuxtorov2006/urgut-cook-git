from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import audit
from apps.accounts.authentication import PublicAuthentication
from apps.accounts.permissions import DEFAULT_PERMS, IsUser
from apps.core.viewsets import TenantModelViewSet
from apps.tenancy import services
from apps.tenancy.models import Branch, Company, Device, Plan, Setting
from apps.tenancy.serializers import (
    BranchSerializer, CompanySerializer, DeviceSerializer, LicenseSerializer, PlanSerializer, SettingSerializer,
    SubscriptionSerializer,
)


class PlanViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Tariflar (ochiq — ro'yxatdan o'tish sahifasi uchun)."""

    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]
    pagination_class = None


class CompanyView(APIView):
    permission_classes = DEFAULT_PERMS
    required_perms = {"patch": "company.manage"}

    def _company(self, request):
        return Company.objects.get(pk=request.company_id)

    @extend_schema(responses=CompanySerializer)
    def get(self, request):
        return Response(CompanySerializer(self._company(request)).data)

    @extend_schema(request=CompanySerializer, responses=CompanySerializer)
    def patch(self, request):
        company = self._company(request)
        old = audit.snapshot(company, ["name", "legal_name", "inn", "phone"])
        s = CompanySerializer(company, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        audit.log("company.updated", entity="Company", entity_id=company.id, old=old, new=s.data, request=request)
        return Response(s.data)


class SubscriptionView(APIView):
    permission_classes = [IsUser]

    @extend_schema(responses=SubscriptionSerializer)
    def get(self, request):
        sub = services.current_subscription(request.company_id)
        return Response(SubscriptionSerializer(sub).data if sub else None)


class LicenseView(APIView):
    """Offline litsenziya tokenini yangilash (qurilma internet bo'lganda chaqiradi)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=LicenseSerializer)
    def get(self, request):
        return Response(services.issue_license_token(request.company_id, getattr(request, "device", None)))


class BranchViewSet(TenantModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = DEFAULT_PERMS
    required_perms = {"list": None, "retrieve": None, "*": "branch.manage"}
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_owner and not user.is_superuser:
            qs = qs.filter(id__in=user.user_branches.filter(deleted_at__isnull=True).values("branch_id"))
        return qs

    def perform_create(self, serializer):
        services.check_branch_limit(self.request.company_id)
        super().perform_create(serializer)
        branch = serializer.instance
        from apps.tenancy.onboarding import init_branch

        init_branch(Company.objects.get(pk=self.request.company_id), branch)
        audit.log("branch.created", entity="Branch", entity_id=branch.id, new=serializer.data, request=self.request)

    def perform_destroy(self, instance):
        if Branch.objects.filter(company_id=instance.company_id).count() <= 1:
            from apps.core.exceptions import BusinessError

            raise BusinessError("Oxirgi filialni o'chirib bo'lmaydi")
        instance.delete()
        audit.log("branch.deleted", entity="Branch", entity_id=instance.id, request=self.request,
                  severity="WARNING")


class DeviceViewSet(TenantModelViewSet):
    queryset = Device.objects.select_related("branch").all()
    serializer_class = DeviceSerializer
    permission_classes = DEFAULT_PERMS
    required_perms = {"list": "device.manage", "retrieve": "device.manage", "*": "device.manage"}
    filterset_fields = ("branch", "mode", "is_active")
    pagination_class = None
    http_method_names = ["get", "patch", "delete", "post", "head", "options"]

    def create(self, request, *args, **kwargs):
        from rest_framework.exceptions import MethodNotAllowed

        raise MethodNotAllowed("POST", detail="Qurilma /auth/devices/register/ orqali qo'shiladi")

    def perform_destroy(self, device):
        device.is_active = False
        device.save(update_fields=["is_active"])
        device.delete()
        audit.log("device.revoked", entity="Device", entity_id=device.id, request=self.request, severity="WARNING")

    @extend_schema(request=None, responses=DeviceSerializer)
    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        """Qurilma tokenini bekor qilish (yo'qolgan/o'g'irlangan planshet)."""
        device = self.get_object()
        device.is_active = False
        device.issue_token()  # eski token endi ishlamaydi
        device.save()
        audit.log("device.revoked", entity="Device", entity_id=device.id, request=request, severity="WARNING")
        return Response(DeviceSerializer(device).data)


class DeviceHeartbeatView(APIView):
    """Qurilma holati: oxirgi faollik va lokal IP (hub topish uchun)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request={"application/json": {"type": "object", "properties": {
        "local_ip": {"type": "string"}, "app_version": {"type": "string"}}}}, responses={200: dict})
    def post(self, request):
        device = getattr(request, "device", None)
        if device is None:
            return Response({"ok": False, "detail": "Qurilma tokeni kerak"}, status=400)
        fields = {"last_seen_at": timezone.now()}
        if request.data.get("local_ip"):
            fields["local_ip"] = request.data["local_ip"]
        if request.data.get("app_version"):
            fields["app_version"] = request.data["app_version"][:20]
        Device.all_objects.filter(pk=device.pk).update(**fields)
        hub = Device.all_objects.filter(branch_id=device.branch_id, mode=Device.Mode.HUB, is_active=True,
                                        deleted_at__isnull=True).first()
        backup = Device.all_objects.filter(branch_id=device.branch_id, is_backup_hub=True, is_active=True,
                                           deleted_at__isnull=True).first()
        return Response({
            "ok": True, "server_time": timezone.now(),
            "hub": {"id": str(hub.id), "code": hub.code, "local_ip": hub.local_ip} if hub else None,
            "backup_hub": {"id": str(backup.id), "code": backup.code, "local_ip": backup.local_ip} if backup else None,
        })


class SettingViewSet(TenantModelViewSet):
    queryset = Setting.objects.all()
    serializer_class = SettingSerializer
    permission_classes = DEFAULT_PERMS
    required_perms = {"list": None, "retrieve": None, "*": "company.manage"}
    filterset_fields = ("branch", "key")
    pagination_class = None
