import 'package:flutter/material.dart';

/// Qurilma birinchi ishga tushganda tanlanadigan rejim (backend Device.Mode bilan mos).
enum DeviceMode {
  pos('POS', 'mode_pos', Icons.point_of_sale),
  hub('HUB', 'mode_pos', Icons.dns),
  waiter('WAITER', 'mode_waiter', Icons.room_service),
  kds('KDS', 'mode_kds', Icons.soup_kitchen),
  manager('MANAGER', 'mode_manager', Icons.insights),
  courier('COURIER', 'mode_courier', Icons.delivery_dining);

  const DeviceMode(this.code, this.labelKey, this.icon);

  final String code;
  final String labelKey;
  final IconData icon;

  static DeviceMode fromCode(String code) =>
      DeviceMode.values.firstWhere((m) => m.code == code, orElse: () => DeviceMode.pos);

  /// Kassa va hub — bir xil ekran; hub qo'shimcha ravishda lokal server ishga tushiradi (4-bosqich).
  bool get isPos => this == DeviceMode.pos || this == DeviceMode.hub;

  /// Telefon + parol bilan kiriladigan rejimlar (qolganlari PIN bilan).
  bool get usesPasswordLogin => this == DeviceMode.manager;

  /// Tanlash ekranida ko'rsatiladigan rejimlar (hub — kassa ichidagi belgi).
  static const selectable = [DeviceMode.pos, DeviceMode.waiter, DeviceMode.kds, DeviceMode.manager, DeviceMode.courier];
}
