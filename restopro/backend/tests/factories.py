"""Test uchun tezkor kompaniya yaratish (shablon bilan)."""
from types import SimpleNamespace

import factory

from apps.accounts.models import User, UserBranch
from apps.accounts.services import create_system_roles
from apps.core import context
from apps.tenancy.models import Branch, Company
from apps.tenancy.onboarding import apply_template
from apps.tenancy.services import register_device, start_trial


class CompanyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Company

    name = factory.Sequence(lambda n: f"Oshxona {n}")
    business_type = "NATIONAL"
    phone = factory.Sequence(lambda n: f"+99890{n:07d}")


def make_company(name, phone, template=True, plan="business"):
    company = CompanyFactory(name=name, phone=phone)
    start_trial(company, plan)
    roles = create_system_roles(company)
    with context.tenant_context(company.id):
        branch = Branch.objects.create(company=company, name="Asosiy", code="B1")
        owner = User.objects.create_user(phone=phone, password="secret123", company=company,
                                         full_name=f"{name} egasi", role=roles["owner"])
        UserBranch.objects.create(company=company, branch=branch, user=owner)
        if template:
            apply_template(company, branch, "NATIONAL")
    device, token = register_device(company_id=company.id, branch_id=branch.id, mode="HUB", name="Kassa",
                                    user=owner)
    return SimpleNamespace(company=company, branch=branch, owner=owner, roles=roles, device=device,
                           device_token=token, id=company.id)


def make_staff(c, role_code, full_name="Xodim", pin=None, phone=None, password=None, branch=None):
    with context.tenant_context(c.company.id):
        u = User.objects.create_user(phone=phone, password=password, company=c.company, full_name=full_name,
                                     role=c.roles[role_code])
        if pin:
            u.set_pin(pin)
            u.save()
        UserBranch.objects.create(company=c.company, branch=branch or c.branch, user=u)
    return u
