from django.db import migrations


def load(apps, schema_editor):
    from apps.tenancy.services import DEFAULT_PLANS

    Plan = apps.get_model("tenancy", "Plan")
    for i, (code, name, price, br, pos, waiters, kds, mgr, cour, mods) in enumerate(DEFAULT_PLANS):
        Plan.objects.update_or_create(code=code, defaults=dict(
            name=name, price_monthly=price, max_branches=br, max_pos=pos, max_waiters=waiters, max_kds=kds,
            max_managers=mgr, max_couriers=cour, modules=mods, sort=i))


class Migration(migrations.Migration):
    dependencies = [("tenancy", "0001_initial")]
    operations = [migrations.RunPython(load, migrations.RunPython.noop)]
