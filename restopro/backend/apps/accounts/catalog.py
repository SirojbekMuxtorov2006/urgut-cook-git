"""Huquqlar katalogi va tizim rollari.

Huquq kodi: "<modul>.<amal>". Ega yangi rol yaratib, istalgan huquqlar
to'plamini bera oladi. "*" — barcha huquqlar (faqat Ega roli).
"""

PERMISSIONS = [
    # (kod, uz, ru, guruh)
    ("company.manage", "Kompaniya sozlamalari", "Настройки компании", "Boshqaruv"),
    ("branch.manage", "Filiallarni boshqarish", "Управление филиалами", "Boshqaruv"),
    ("device.manage", "Qurilmalarni boshqarish", "Управление устройствами", "Boshqaruv"),
    ("staff.view", "Xodimlarni ko'rish", "Просмотр сотрудников", "Xodimlar"),
    ("staff.manage", "Xodimlarni boshqarish", "Управление сотрудниками", "Xodimlar"),
    ("role.manage", "Rollar va huquqlar", "Роли и права", "Xodimlar"),
    ("audit.view", "Audit jurnali", "Журнал аудита", "Boshqaruv"),
    ("menu.view", "Menyuni ko'rish", "Просмотр меню", "Menyu"),
    ("menu.manage", "Menyu va narxlarni o'zgartirish", "Изменение меню и цен", "Menyu"),
    ("stoplist.manage", "Stop-list", "Стоп-лист", "Menyu"),
    ("floor.manage", "Zal va stollar", "Залы и столы", "Zal"),
    ("order.create", "Buyurtma yaratish", "Создание заказа", "Buyurtma"),
    ("order.view_all", "Barcha stollarni ko'rish", "Видеть все столы", "Buyurtma"),
    ("order.void_sent", "Oshxonaga yuborilganni bekor qilish", "Отмена отправленного", "Buyurtma"),
    ("order.discount", "Chegirma berish", "Скидки", "Buyurtma"),
    ("order.price_override", "Narxni qo'lda o'zgartirish", "Ручная цена", "Buyurtma"),
    ("order.move", "Stol/ofitsiantga ko'chirish", "Перенос стола", "Buyurtma"),
    ("payment.accept", "To'lov qabul qilish", "Приём оплаты", "Kassa"),
    ("payment.refund", "Qaytarish va chekni bekor qilish", "Возврат и отмена чека", "Kassa"),
    ("shift.manage", "Smena ochish/yopish", "Открытие/закрытие смены", "Kassa"),
    ("cash.operations", "Inkassatsiya va xarajat", "Инкассация и расходы", "Kassa"),
    ("kitchen.view", "Oshxona ekrani", "Экран кухни", "Oshxona"),
    ("inventory.view", "Omborni ko'rish", "Просмотр склада", "Ombor"),
    ("inventory.manage", "Ombor hujjatlari", "Складские документы", "Ombor"),
    ("purchasing.manage", "Xaridlar", "Закупки", "Ombor"),
    ("delivery.manage", "Yetkazib berish", "Доставка", "Yetkazish"),
    ("delivery.courier", "Kuryer ishlari", "Работа курьера", "Yetkazish"),
    ("crm.manage", "Mijozlar va sodiqlik", "Клиенты и лояльность", "Mijozlar"),
    ("finance.view", "Moliya", "Финансы", "Moliya"),
    ("finance.manage", "Moliya amallari", "Финансовые операции", "Moliya"),
    ("reports.view", "Hisobotlar", "Отчёты", "Hisobotlar"),
    ("reports.finance", "Moliyaviy hisobotlar (P&L)", "Финансовые отчёты", "Hisobotlar"),
]

PERMISSION_CODES = {p[0] for p in PERMISSIONS}

SYSTEM_ROLES = {
    # kod: (nomi, login turi, chegirma limiti %, huquqlar)
    "owner": ("Ega", "password", 100, ["*"]),
    "manager": ("Menejer", "password", 50, [
        "branch.manage", "device.manage", "staff.view", "staff.manage", "audit.view",
        "menu.view", "menu.manage", "stoplist.manage", "floor.manage", "order.create", "order.view_all",
        "order.void_sent", "order.discount", "order.move", "payment.accept", "payment.refund",
        "shift.manage", "cash.operations", "kitchen.view", "inventory.view", "inventory.manage",
        "purchasing.manage", "delivery.manage", "crm.manage", "finance.view", "reports.view",
    ]),
    "cashier": ("Kassir", "pin", 10, [
        "menu.view", "stoplist.manage", "order.create", "order.view_all", "order.discount",
        "order.move", "payment.accept", "shift.manage", "cash.operations", "delivery.manage",
    ]),
    "waiter": ("Ofitsiant", "pin", 0, ["menu.view", "order.create"]),
    "cook": ("Oshpaz", "pin", 0, ["kitchen.view", "stoplist.manage", "menu.view"]),
    "storekeeper": ("Omborchi", "password", 0, [
        "menu.view", "inventory.view", "inventory.manage", "purchasing.manage",
    ]),
    "accountant": ("Buxgalter", "password", 0, [
        "reports.view", "reports.finance", "finance.view", "finance.manage", "inventory.view", "audit.view",
    ]),
    "courier": ("Kuryer", "pin", 0, ["delivery.courier"]),
}


def ensure_permissions():
    """Huquqlar katalogini bazaga yozadi (migratsiya + test DB tozalanganda ham ishlaydi)."""
    from apps.accounts.models import Permission

    if Permission.objects.count() >= len(PERMISSIONS):
        return
    for code, uz, ru, group in PERMISSIONS:
        Permission.objects.update_or_create(code=code, defaults={"name_uz": uz, "name_ru": ru, "group": group})
