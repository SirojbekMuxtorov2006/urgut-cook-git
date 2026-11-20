"""Offline hujjat raqami: {qurilma_kodi}-{yil}-{tartib}, masalan K1-2026-004512."""
from django.db import transaction
from django.utils import timezone


def format_doc_number(device_code: str, year: int, seq: int) -> str:
    return f"{device_code}-{year}-{seq:06d}"


@transaction.atomic
def next_doc_number(device, kind: str = "receipt") -> str:
    from apps.tenancy.models import DocumentCounter

    year = timezone.localdate().year
    counter, _ = DocumentCounter.all_objects.select_for_update().get_or_create(
        company_id=device.company_id, device=device, kind=kind, year=year, defaults={"value": 0}
    )
    counter.value += 1
    counter.save(update_fields=["value"])
    return format_doc_number(device.code, year, counter.value)
