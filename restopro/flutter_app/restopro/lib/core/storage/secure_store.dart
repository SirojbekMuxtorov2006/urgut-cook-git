import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../utils/uuid7.dart';

/// Tokenlar va qurilma ma'lumotlari faqat xavfsiz xotirada saqlanadi.
class SecureStore {
  SecureStore([FlutterSecureStorage? storage])
      : _s = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final FlutterSecureStorage _s;

  static const _serverUrl = 'server_url';
  static const _deviceToken = 'device_token';
  static const _device = 'device_json';
  static const _access = 'access_token';
  static const _refresh = 'refresh_token';
  static const _license = 'license_json';
  static const _hardwareId = 'hardware_id';

  Future<String?> serverUrl() => _s.read(key: _serverUrl);
  Future<void> setServerUrl(String v) => _s.write(key: _serverUrl, value: v);

  Future<String?> deviceToken() => _s.read(key: _deviceToken);
  Future<Map<String, dynamic>?> device() async => _decode(await _s.read(key: _device));
  Future<void> saveDevice(String token, Map<String, dynamic> device) async {
    await _s.write(key: _deviceToken, value: token);
    await _s.write(key: _device, value: jsonEncode(device));
  }

  Future<Map<String, dynamic>?> license() async => _decode(await _s.read(key: _license));
  Future<void> saveLicense(Map<String, dynamic> license) => _s.write(key: _license, value: jsonEncode(license));

  Future<({String? access, String? refresh})> tokens() async =>
      (access: await _s.read(key: _access), refresh: await _s.read(key: _refresh));
  Future<void> saveTokens(String access, String refresh) async {
    await _s.write(key: _access, value: access);
    await _s.write(key: _refresh, value: refresh);
  }

  Future<void> clearTokens() async {
    await _s.delete(key: _access);
    await _s.delete(key: _refresh);
  }

  Future<void> clearDevice() async {
    await clearTokens();
    await _s.delete(key: _deviceToken);
    await _s.delete(key: _device);
    await _s.delete(key: _license);
  }

  /// Qurilmaning doimiy identifikatori (qayta ro'yxatdan o'tganda tarif limiti sarflanmasligi uchun).
  Future<String> hardwareId() async {
    var id = await _s.read(key: _hardwareId);
    if (id == null) {
      id = Uuid7.generate();
      await _s.write(key: _hardwareId, value: id);
    }
    return id;
  }

  Map<String, dynamic>? _decode(String? raw) => raw == null ? null : jsonDecode(raw) as Map<String, dynamic>;
}

final secureStoreProvider = Provider<SecureStore>((ref) => SecureStore());
