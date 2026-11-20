from django.db import models


class MoneyField(models.DecimalField):
    """Pul summasi: DecimalField(14, 2)."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_digits", 14)
        kwargs.setdefault("decimal_places", 2)
        kwargs.setdefault("default", 0)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, _path, args, kwargs = super().deconstruct()
        return name, "apps.core.fields.MoneyField", args, kwargs


class QtyField(models.DecimalField):
    """Miqdor: DecimalField(14, 3)."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_digits", 14)
        kwargs.setdefault("decimal_places", 3)
        kwargs.setdefault("default", 0)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, _path, args, kwargs = super().deconstruct()
        return name, "apps.core.fields.QtyField", args, kwargs
