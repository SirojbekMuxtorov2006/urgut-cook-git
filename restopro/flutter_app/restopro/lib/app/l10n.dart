import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final localeProvider = StateProvider<Locale>((ref) => const Locale('uz'));

/// Oddiy tarjima jadvali (uz — lotin, ru). Kalit topilmasa o'zbekcha qaytadi.
class AppStrings {
  static const supportedLocales = [Locale('uz'), Locale('ru'), Locale('en')];

  static const Map<String, Map<String, String>> _t = {
    'app_title': {'uz': 'RestoPro', 'ru': 'RestoPro'},
    'server_setup': {'uz': 'Serverni sozlash', 'ru': 'Настройка сервера'},
    'server_url': {'uz': 'Server manzili', 'ru': 'Адрес сервера'},
    'check_connection': {'uz': 'Ulanishni tekshirish', 'ru': 'Проверить связь'},
    'continue': {'uz': 'Davom etish', 'ru': 'Продолжить'},
    'device_setup': {'uz': 'Qurilmani ulash', 'ru': 'Подключение устройства'},
    'owner_login_hint': {
      'uz': 'Ega yoki menejer telefon raqami va paroli bilan bir marta kiring',
      'ru': 'Войдите один раз телефоном и паролем владельца или менеджера',
    },
    'phone': {'uz': 'Telefon raqam', 'ru': 'Телефон'},
    'password': {'uz': 'Parol', 'ru': 'Пароль'},
    'login': {'uz': 'Kirish', 'ru': 'Войти'},
    'branch': {'uz': 'Filial', 'ru': 'Филиал'},
    'device_mode': {'uz': 'Qurilma rejimi', 'ru': 'Режим устройства'},
    'device_name': {'uz': 'Qurilma nomi', 'ru': 'Название устройства'},
    'is_hub': {'uz': 'Asosiy kassa (lokal hub)', 'ru': 'Главная касса (локальный хаб)'},
    'is_backup_hub': {'uz': 'Zaxira hub', 'ru': 'Резервный хаб'},
    'register_device': {'uz': 'Qurilmani ro\'yxatdan o\'tkazish', 'ru': 'Зарегистрировать устройство'},
    'enter_pin': {'uz': 'PIN kodni kiriting', 'ru': 'Введите PIN-код'},
    'choose_user': {'uz': 'Xodimni tanlang', 'ru': 'Выберите сотрудника'},
    'lock': {'uz': 'Bloklash', 'ru': 'Заблокировать'},
    'logout_device': {'uz': 'Qurilmani uzish', 'ru': 'Отключить устройство'},
    'online': {'uz': 'Online', 'ru': 'Онлайн'},
    'offline': {'uz': 'Internet yo\'q', 'ru': 'Нет интернета'},
    'mode_pos': {'uz': 'Kassa', 'ru': 'Касса'},
    'mode_waiter': {'uz': 'Ofitsiant', 'ru': 'Официант'},
    'mode_kds': {'uz': 'Oshxona', 'ru': 'Кухня'},
    'mode_manager': {'uz': 'Boshqaruv', 'ru': 'Управление'},
    'mode_courier': {'uz': 'Kuryer', 'ru': 'Курьер'},
    'error': {'uz': 'Xatolik', 'ru': 'Ошибка'},
    'retry': {'uz': 'Qayta urinish', 'ru': 'Повторить'},
  };

  static String of(Locale locale, String key) => _t[key]?[locale.languageCode] ?? _t[key]?['uz'] ?? key;
}

extension L10nX on WidgetRef {
  /// build() ichida — til o'zgarsa qayta chiziladi.
  String tr(String key) => AppStrings.of(watch(localeProvider), key);

  /// Callback va dialoglar ichida.
  String trRead(String key) => AppStrings.of(read(localeProvider), key);
}
