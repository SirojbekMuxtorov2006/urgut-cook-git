from django.db import transaction
from rest_framework import viewsets

from apps.core import context
from apps.core.exceptions import BusinessError


class TenantViewSetMixin:
    """Tenant izolyatsiyasining ikkinchi qatlami.

    Manager allaqachon kontekst bo'yicha filtrlaydi; bu yerda esa so'rovdagi
    company bo'yicha aniq filtr qo'yiladi va yangi yozuvga company/branch
    majburan o'rnatiladi (mijoz yuborgan company_id e'tiborga olinmaydi).
    """

    branch_scoped = False  # True bo'lsa X-Branch-ID bo'yicha ham filtrlaydi

    def get_company_id(self):
        return self.request.company_id

    def get_queryset(self):
        qs = super().get_queryset().filter(company_id=self.get_company_id())
        if self.branch_scoped:
            branch_id = context.get_branch_id()
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        extra = {"company_id": self.get_company_id(), "created_by_id": context.get_user_id(),
                 "device_id": context.get_device_id()}
        if self.branch_scoped and "branch" not in serializer.validated_data:
            if not context.get_branch_id():
                raise BusinessError("X-Branch-ID sarlavhasi kerak", code="branch_required")
            extra["branch_id"] = context.get_branch_id()
        serializer.save(**extra)


class TenantModelViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    @transaction.atomic
    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()  # yumshoq o'chirish


class TenantReadOnlyViewSet(TenantViewSetMixin, viewsets.ReadOnlyModelViewSet):
    pass
