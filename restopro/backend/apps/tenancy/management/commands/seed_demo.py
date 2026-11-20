"""Demo ma'lumotlar: 1 kompaniya, 1 filial, 2 zal, 20 stol, xodimlar, 3 sex, 40 taom retseptlari bilan.

    python manage.py seed_demo            # mavjud bo'lsa o'tkazib yuboradi
    python manage.py seed_demo --reset    # demo kompaniyani o'chirib, qaytadan yaratadi
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User, UserBranch
from apps.accounts.services import create_system_roles
from apps.core import context
from apps.floor.models import Table
from apps.menu.models import MenuItem
from apps.tenancy.models import Branch, Company, Device, Plan, Subscription
from apps.tenancy.onboarding import apply_template
from apps.tenancy.services import ensure_default_plans, purge_company, register_device

DEMO_PHONE = "+998901234567"
DEMO_PASSWORD = "demo1234"

STAFF = [
    # (ism, rol, telefon, parol, pin)
    ("Sardor Rahimov", "owner", DEMO_PHONE, DEMO_PASSWORD, "0000"),
    ("Jasur Karimov", "manager", "+998901234568", "manager123", "1111"),
    ("Dilshod Tursunov", "cashier", None, None, "2001"),
    ("Malika Yusupova", "cashier", None, None, "2002"),
    ("Aziz Normatov", "waiter", None, None, "3001"),
    ("Bekzod Aliyev", "waiter", None, None, "3002"),
    ("Shahzod Qodirov", "waiter", None, None, "3003"),
    ("Kamola Ergasheva", "waiter", None, None, "3004"),
    ("Rustam oshpaz", "cook", None, None, "4001"),
    ("Akmal somsapaz", "cook", None, None, "4002"),
]


class Command(BaseCommand):
    help = "Demo restoran ma'lumotlarini yaratadi"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Demo kompaniyani o'chirib qayta yaratish")

    def handle(self, *args, reset=False, **opts):
        existing = Company.objects.filter(phone=DEMO_PHONE).first()
        if existing and not reset:
            self.stdout.write(self.style.WARNING("Demo kompaniya mavjud. Qayta yaratish: seed_demo --reset"))
            return
        if existing:
            purge_company(existing)
        self._create()

    @transaction.atomic
    def _create(self):
        ensure_default_plans()
        company = Company.objects.create(name="Registon Milliy Taomlari", business_type="NATIONAL",
                                         phone=DEMO_PHONE, legal_name='"Registon Taom" MChJ', inn="301234567")
        Subscription.objects.create(company=company, plan=Plan.objects.get(code="pro"),
                                    status=Subscription.Status.ACTIVE, ends_at=timezone.now() + timedelta(days=365))
        roles = create_system_roles(company)
        with context.tenant_context(company.id):
            branch = Branch.objects.create(
                company=company, name="Registon filiali", code="B1", phone="+998900000000",
                address="Samarqand sh., Registon ko'chasi 1", service_charge_percent=10,
                receipt_header='"REGISTON MILLIY TAOMLARI"\nSamarqand sh., Registon ko\'chasi 1\nTel: +998 90 000 00 00')
            stats = apply_template(company, branch, "NATIONAL")

            users = {}
            for name, role, phone, password, pin in STAFF:
                u = User.objects.create_user(phone=phone, password=password, company=company, full_name=name,
                                             role=roles[role])
                u.set_pin(pin)
                u.save()
                UserBranch.objects.create(company=company, branch=branch, user=u)
                users.setdefault(role, []).append(u)

            # Ofitsiantlarga stollarni taqsimlash (har biriga 5 tadan)
            waiters = users["waiter"]
            for i, table in enumerate(Table.objects.filter(branch=branch).order_by("sort", "created_at")):
                table.waiter = waiters[i % len(waiters)]
                table.save(update_fields=["waiter"])

            owner = users["owner"][0]
            devices = []
            for mode, name, backup in (("HUB", "Asosiy kassa", False), ("POS", "Kassa 2", True),
                                       ("KDS", "Oshxona ekrani", False), ("WAITER", "Ofitsiant telefoni 1", False)):
                d, token = register_device(company_id=company.id, branch_id=branch.id, mode=mode, name=name,
                                           platform="demo", is_backup_hub=backup, user=owner)
                devices.append((d, token))

        w = self.stdout.write
        w(self.style.SUCCESS("\n✅ Demo ma'lumotlar yaratildi"))
        w(f"Kompaniya: {company.name}  |  Filial: {branch.name} ({branch.id})")
        w(f"Sexlar: {stats['stations']}, kategoriyalar: {stats['categories']}, taomlar: "
          f"{MenuItem.objects.filter(company=company).count()}, stollar: {stats['tables']}")
        w("\n👤 Telefon + parol bilan kirish (web panel / boshqaruv):")
        w(f"   Ega:     {DEMO_PHONE} / {DEMO_PASSWORD}")
        w("   Menejer: +998901234568 / manager123")
        w("\n🔢 PIN kodlar (kassa / ofitsiant / oshxona):")
        for name, role, _p, _pw, pin in STAFF:
            w(f"   {pin}  {name} ({roles[role].name})")
        w("\n📟 Qurilma tokenlari (X-Device-Token):")
        for d, token in devices:
            w(f"   {d.code:<4} {d.get_mode_display():<28} {token}")
        w("")
