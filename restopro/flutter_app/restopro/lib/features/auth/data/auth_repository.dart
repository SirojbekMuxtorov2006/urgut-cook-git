import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/device_mode.dart';
import '../../../core/db/database.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_store.dart';
import '../domain/models.dart';

class AuthResult {
  const AuthResult(this.access, this.refresh, this.user);
  final String access;
  final String refresh;
  final AppUser user;

  factory AuthResult.fromJson(Map<String, dynamic> j) => AuthResult(
        j['access'] as String,
        j['refresh'] as String,
        AppUser.fromJson(Map<String, dynamic>.from(j['user'] as Map)),
      );
}

class AuthRepository {
  AuthRepository(this._api, this._store, this._db);

  final ApiClient _api;
  final SecureStore _store;
  final AppDatabase _db;

  Future<AuthResult> passwordLogin(String phone, String password) async {
    final data = await _api.post<Map<String, dynamic>>('/auth/login/', {'phone': phone, 'password': password}, true);
    return AuthResult.fromJson(data);
  }

  Future<({DeviceInfo device, String token, Map<String, dynamic> license})> registerDevice({
    required String branchId,
    required DeviceMode mode,
    required String name,
    required String platform,
    bool isBackupHub = false,
  }) async {
    final data = await _api.post<Map<String, dynamic>>('/auth/devices/register/', {
      'branch': branchId,
      'mode': mode.code,
      'name': name,
      'platform': platform,
      'app_version': '0.1.0',
      'hardware_id': await _store.hardwareId(),
      'is_backup_hub': isBackupHub,
    });
    final device = DeviceInfo.fromJson(data);
    final token = data['device_token'] as String;
    final license = Map<String, dynamic>.from(data['license'] as Map);
    await _store.saveDevice(token, device.toJson());
    await _store.saveLicense(license);
    return (device: device, token: token, license: license);
  }

  /// PIN ekrani uchun xodimlar. Internet bo'lmasa — Drift keshidan.
  Future<List<PinUser>> pinUsers() async {
    try {
      final list = await _api.get<List<dynamic>>('/auth/pin-users/');
      final users = list.map((e) => PinUser.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      await _db.replaceStaff(users
          .map((u) => CachedStaffCompanion.insert(
                id: u.id,
                fullName: u.fullName,
                role: Value(u.role),
                roleCode: Value(u.roleCode),
                updatedAt: DateTime.now(),
              ))
          .toList());
      return users;
    } catch (_) {
      final cached = await _db.staff();
      if (cached.isEmpty) rethrow;
      return cached.map((c) => PinUser(id: c.id, fullName: c.fullName, role: c.role, roleCode: c.roleCode)).toList();
    }
  }

  Future<AuthResult> pinLogin(String pin, {String? userId}) async {
    final data = await _api.post<Map<String, dynamic>>(
        '/auth/pin-login/', {'pin': pin, if (userId != null) 'user_id': userId}, true);
    return AuthResult.fromJson(data);
  }

  Future<AppUser> me() async => AppUser.fromJson(await _api.get<Map<String, dynamic>>('/auth/me/'));

  Future<void> logout(String? refresh) async {
    if (refresh == null) return;
    try {
      await _api.post<dynamic>('/auth/logout/', {'refresh': refresh});
    } catch (_) {
      // Offline bo'lsa ham lokal sessiya yopiladi.
    }
  }

  Future<Map<String, dynamic>> refreshLicense() async {
    final lic = await _api.get<Map<String, dynamic>>('/tenancy/license/');
    await _store.saveLicense(lic);
    return lic;
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(
      ref.watch(apiClientProvider),
      ref.watch(secureStoreProvider),
      ref.watch(databaseProvider),
    ));
