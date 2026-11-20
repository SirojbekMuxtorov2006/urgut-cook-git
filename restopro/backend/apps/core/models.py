"""Barcha biznes modellari uchun asos: TenantBaseModel.

* id — UUID v7 (offline qurilmada ham yaratiladi)
* company — tenant; TenantManager joriy kontekst bo'yicha avtomatik filtrlaydi
* deleted_at — yumshoq o'chirish
* version — har saqlashda +1 (sinxron va konflikt aniqlash uchun)
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core import context
from apps.core.ids import uuid7


class TenantQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def soft_delete(self):
        return self.update(deleted_at=timezone.now(), updated_at=timezone.now())

    def for_company(self, company_id):
        return self.filter(company_id=company_id)


class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    """Joriy tenant kontekstiga ko'ra avtomatik filtrlaydi va o'chirilganlarni yashiradi."""

    def get_queryset(self):
        qs = super().get_queryset().filter(deleted_at__isnull=True)
        company_id = context.get_company_id()
        if company_id is not None:
            qs = qs.filter(company_id=company_id)
        return qs


class UnscopedManager(models.Manager.from_queryset(TenantQuerySet)):
    """Filtrsiz menejer — faqat tizim ichki ishlari (sync, superadmin, celery) uchun."""


class TimestampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = set(update_fields) | {"updated_at"}
        super().save(*args, **kwargs)


class TenantBaseModel(TimestampedModel):
    company = models.ForeignKey("tenancy.Company", on_delete=models.CASCADE, related_name="+")
    deleted_at = models.DateTimeField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    device = models.ForeignKey(
        "tenancy.Device", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    objects = TenantManager()
    all_objects = UnscopedManager()

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["company", "updated_at"], name="%(app_label)s_%(class)s_cu")]

    def save(self, *args, **kwargs):
        if not self.company_id:
            self.company_id = context.get_company_id()
        if self.company_id is None:
            raise ValueError(f"{self.__class__.__name__}: company aniqlanmagan (tenant konteksti yo'q)")
        if self._state.adding:
            self.created_by_id = self.created_by_id or context.get_user_id()
            self.device_id = self.device_id or context.get_device_id()
        else:
            self.version = (self.version or 0) + 1
            if kwargs.get("update_fields") is not None:
                kwargs["update_fields"] = set(kwargs["update_fields"]) | {"version"}
        super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        """Yumshoq o'chirish. Qattiq o'chirish uchun hard_delete()."""
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        return super().delete(using=using, keep_parents=keep_parents)


class BranchScopedModel(TenantBaseModel):
    """Filialga tegishli yozuvlar (stol, sex, qurilma, ombor...)."""

    branch = models.ForeignKey("tenancy.Branch", on_delete=models.CASCADE, related_name="+")

    class Meta(TenantBaseModel.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        if not self.branch_id:
            self.branch_id = context.get_branch_id()
        if self.branch_id and not self.company_id:
            from apps.tenancy.models import Branch

            self.company_id = Branch.all_objects.values_list("company_id", flat=True).get(pk=self.branch_id)
        super().save(*args, **kwargs)
