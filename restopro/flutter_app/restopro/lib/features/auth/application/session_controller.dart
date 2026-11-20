import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/device_mode.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_store.dart';
import '../data/auth_repository.dart';
import '../domain/models.dart';

enum SessionStage { loading, needsServer, needsDevice, locked, active }

class SessionState {
  const SessionState({required this.stage, this.serverUrl, this.device, this.user, this.licenseExpiresAt});

  final SessionStage stage;
  final String? serverUrl;
  final DeviceInfo? device;
  final AppUser? user;
  final DateTime? licenseExpiresAt;

  /// Offline litsenziya 7 kunlik; muddati o'tsa qurilma internetga ulanishi kerak.
  bool get licenseExpired => licenseExpiresAt != null && DateTime.now().isAfter(licenseExpiresAt!);

  SessionState copyWith({SessionStage? stage, String? serverUrl, DeviceInfo? device, AppUser? user, bool clearUser = false,
      DateTime? licenseExpiresAt}) =>
      SessionState(
        stage: stage ?? this.stage,
        serverUrl: serverUrl ?? this.serverUrl,
        device: device ?? this.device,
        user: clearUser ? null : (user ?? this.user),
        licenseExpiresAt: licenseExpiresAt ?? this.licenseExpiresAt,
      );
}

class SessionController extends Notifier<SessionState> {
  ApiClient get _api => ref.read(apiClientProvider);
  SecureStore get _store => ref.read(secureStoreProvider);
  AuthRepository get _repo => ref.read(authRepositoryProvider);

  @override
  SessionState build() {
    Future.microtask(_restore);
    return const SessionState(stage: SessionStage.loading);
  }

  Future<void> _restore() async {
    await _api.load();
    _api.onSessionExpired = lock;
    final url = _api.baseUrl;
    if (url == null) {
      state = const SessionState(stage: SessionStage.needsServer);
      return;
    }
    final deviceJson = await _store.device();
    if (deviceJson == null) {
      state = SessionState(stage: SessionStage.needsDevice, serverUrl: url);
      return;
    }
    final device = DeviceInfo.fromJson(deviceJson);
    _api.setBranch(device.branch.id);
    final license = await _store.license();
    final exp = _licenseExp(license);
    if (_api.hasSession) {
      try {
        final user = await _repo.me();
        state = SessionState(stage: SessionStage.active, serverUrl: url, device: device, user: user, licenseExpiresAt: exp);
        _refreshLicenseQuietly();
        return;
      } catch (_) {
        // Token eskirgan yoki offline — PIN ekraniga.
      }
    }
    state = SessionState(stage: SessionStage.locked, serverUrl: url, device: device, licenseExpiresAt: exp);
  }

  DateTime? _licenseExp(Map<String, dynamic>? license) {
    final exp = (license?['payload'] as Map?)?['exp'];
    return exp is int ? DateTime.fromMillisecondsSinceEpoch(exp * 1000) : null;
  }

  Future<void> _refreshLicenseQuietly() async {
    try {
      final lic = await _repo.refreshLicense();
      state = state.copyWith(licenseExpiresAt: _licenseExp(lic));
    } catch (_) {}
  }

  Future<void> setServer(String url) async {
    final normalized = ApiClient.normalizeUrl(url);
    await _store.setServerUrl(normalized);
    _api.setBaseUrl(normalized);
    state = SessionState(stage: SessionStage.needsDevice, serverUrl: normalized);
  }

  /// Server manzilini qayta kiritish ekraniga qaytish.
  void setServerPrompt() => state = const SessionState(stage: SessionStage.needsServer);

  /// Qurilmani ulash: ega/menejer tokeni bilan ro'yxatdan o'tkaziladi.
  Future<void> registerDevice({
    required AuthResult ownerAuth,
    required BranchRef branch,
    required DeviceMode mode,
    required String name,
    bool isBackupHub = false,
  }) async {
    await _api.setTokens(ownerAuth.access, ownerAuth.refresh, persist: false);
    final result = await _repo.registerDevice(
      branchId: branch.id,
      mode: mode,
      name: name,
      platform: Platform.operatingSystem,
      isBackupHub: isBackupHub,
    );
    _api.setDeviceToken(result.token);
    _api.setBranch(branch.id);
    final exp = _licenseExp(result.license);
    if (mode.usesPasswordLogin) {
      // Boshqaruv rejimi: ega o'z sessiyasida qoladi.
      await _api.setTokens(ownerAuth.access, ownerAuth.refresh);
      state = SessionState(
          stage: SessionStage.active, serverUrl: state.serverUrl, device: result.device, user: ownerAuth.user, licenseExpiresAt: exp);
    } else {
      // Kassa/ofitsiant/oshxona: egasining tokeni saqlanmaydi, xodim PIN bilan kiradi.
      await _api.clearTokens();
      state = SessionState(stage: SessionStage.locked, serverUrl: state.serverUrl, device: result.device, licenseExpiresAt: exp);
    }
  }

  Future<void> pinLogin(String pin, {String? userId}) async {
    final r = await _repo.pinLogin(pin, userId: userId);
    await _api.setTokens(r.access, r.refresh);
    state = state.copyWith(stage: SessionStage.active, user: r.user);
  }

  Future<void> passwordLogin(String phone, String password) async {
    final r = await _repo.passwordLogin(phone, password);
    await _api.setTokens(r.access, r.refresh);
    state = state.copyWith(stage: SessionStage.active, user: r.user);
  }

  /// Ekranni bloklash (keyingi xodim PIN bilan kiradi).
  Future<void> lock() async {
    final tokens = await _store.tokens();
    await _repo.logout(tokens.refresh);
    await _api.clearTokens();
    if (state.device == null) return;
    state = state.copyWith(stage: SessionStage.locked, clearUser: true);
  }

  /// Qurilmani uzish (rejimni qayta tanlash uchun).
  Future<void> unlinkDevice() async {
    await _store.clearDevice();
    await _api.clearTokens();
    _api.setDeviceToken(null);
    _api.setBranch(null);
    state = SessionState(stage: SessionStage.needsDevice, serverUrl: state.serverUrl);
  }
}

final sessionProvider = NotifierProvider<SessionController, SessionState>(SessionController.new);
