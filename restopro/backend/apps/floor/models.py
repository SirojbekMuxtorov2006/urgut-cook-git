"""Zal va stollar (1-bosqich: modellar; bron va xarita API — 2-bosqichda)."""
from django.db import models

from apps.core.models import BranchScopedModel


class Hall(BranchScopedModel):
    name = models.CharField(max_length=100)
    sort = models.PositiveIntegerField(default=0)
    service_charge_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                                 help_text="Bo'sh bo'lsa filial sozlamasi ishlatiladi")
    is_active = models.BooleanField(default=True)

    class Meta(BranchScopedModel.Meta):
        ordering = ["sort", "name"]

    def __str__(self):
        return self.name


class Table(BranchScopedModel):
    class Shape(models.TextChoices):
        SQUARE = "square"
        ROUND = "round"
        RECT = "rect"

    class Status(models.TextChoices):
        FREE = "FREE", "Bo'sh"
        BUSY = "BUSY", "Band"
        BILL = "BILL", "Hisob so'raldi"
        RESERVED = "RESERVED", "Bron"

    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name="tables")
    name = models.CharField(max_length=20)
    seats = models.PositiveSmallIntegerField(default=4)
    shape = models.CharField(max_length=10, choices=Shape.choices, default=Shape.SQUARE)
    pos_x = models.IntegerField(default=0)
    pos_y = models.IntegerField(default=0)
    width = models.PositiveIntegerField(default=100)
    height = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.FREE)
    occupied_since = models.DateTimeField(null=True, blank=True)
    waiter = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    sort = models.PositiveIntegerField(default=0)

    class Meta(BranchScopedModel.Meta):
        ordering = ["sort", "name"]
        indexes = BranchScopedModel.Meta.indexes + [
            models.Index(fields=["branch", "status"], name="floor_table_branch_status"),
        ]

    def __str__(self):
        return f"{self.hall.name} / {self.name}"
