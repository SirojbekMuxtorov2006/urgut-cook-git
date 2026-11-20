from django.db import migrations


def load(apps, schema_editor):
    from apps.accounts.catalog import PERMISSIONS

    Permission = apps.get_model("accounts", "Permission")
    for code, uz, ru, group in PERMISSIONS:
        Permission.objects.update_or_create(code=code, defaults={"name_uz": uz, "name_ru": ru, "group": group})


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_initial")]
    operations = [migrations.RunPython(load, migrations.RunPython.noop)]
