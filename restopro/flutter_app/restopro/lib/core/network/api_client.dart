import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_store.dart';
import 'api_exception.dart';

/// Bulut API mijozi: JWT + X-Device-Token sarlavhalari, 401 da refresh token bilan avtomatik yangilash.
class ApiClient {
  ApiClient(this._store) {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 20),
      contentType: 'application/json',
    ));
    _dio.interceptors.add(QueuedInterceptorsWrapper(onRequest: _onRequest, onError: _onError));
  }

  final SecureStore _store;
  late final Dio _dio;

  String? _baseUrl;
  String? _access;
  String? _refresh;
  String? _deviceToken;
  String? _branchId;
  String language = 'uz';

  /// Refresh ham muvaffaqiyatsiz bo'lsa chaqiriladi (PIN ekraniga qaytish).
  void Function()? onSessionExpired;

  Future<void> load() async {
    _baseUrl = await _store.serverUrl();
    final t = await _store.tokens();
    _access = t.access;
    _refresh = t.refresh;
    _deviceToken = await _store.deviceToken();
  }

  String? get baseUrl => _baseUrl;
  bool get hasSession => _access != null;

  void setBaseUrl(String url) => _baseUrl = normalizeUrl(url);
  void setDeviceToken(String? token) => _deviceToken = token;
  void setBranch(String? branchId) => _branchId = branchId;

  Future<void> setTokens(String access, String refresh, {bool persist = true}) async {
    _access = access;
    _refresh = refresh;
    if (persist) await _store.saveTokens(access, refresh);
  }

  Future<void> clearTokens() async {
    _access = null;
    _refresh = null;
    await _store.clearTokens();
  }

  static String normalizeUrl(String url) {
    var u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'http://$u';
    while (u.endsWith('/')) {
      u = u.substring(0, u.length - 1);
    }
    return u;
  }

  void _onRequest(RequestOptions o, RequestInterceptorHandler h) {
    if (_baseUrl == null) {
      return h.reject(DioException(requestOptions: o, message: 'Server manzili sozlanmagan'));
    }
    if (!o.path.startsWith('http')) o.baseUrl = '$_baseUrl/api/v1';
    o.headers['Accept-Language'] = language;
    if (_deviceToken != null) o.headers['X-Device-Token'] = _deviceToken;
    if (_branchId != null) o.headers['X-Branch-ID'] = _branchId;
    if (_access != null && o.extra['noAuth'] != true) o.headers['Authorization'] = 'Bearer $_access';
    h.next(o);
  }

  Future<void> _onError(DioException e, ErrorInterceptorHandler h) async {
    final o = e.requestOptions;
    final canRefresh = e.response?.statusCode == 401 && _refresh != null && o.extra['retried'] != true &&
        !o.path.contains('/auth/refresh/');
    if (!canRefresh) return h.next(e);
    try {
      final r = await Dio(BaseOptions(baseUrl: '$_baseUrl/api/v1'))
          .post('/auth/refresh/', data: {'refresh': _refresh});
      await setTokens(r.data['access'] as String, (r.data['refresh'] ?? _refresh) as String);
      o.extra['retried'] = true;
      o.headers['Authorization'] = 'Bearer $_access';
      return h.resolve(await _dio.fetch(o));
    } catch (_) {
      await clearTokens();
      onSessionExpired?.call();
      return h.next(e);
    }
  }

  Future<T> _wrap<T>(Future<Response<dynamic>> Function() call) async {
    try {
      final r = await call();
      return r.data as T;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) => _wrap(() => _dio.get(path, queryParameters: query));
  Future<T> post<T>(String path, [Object? data, bool noAuth = false]) =>
      _wrap(() => _dio.post(path, data: data, options: Options(extra: {'noAuth': noAuth})));
  Future<T> patch<T>(String path, [Object? data]) => _wrap(() => _dio.patch(path, data: data));
  Future<T> delete<T>(String path) => _wrap(() => _dio.delete(path));

  /// Server tekshiruvi (sozlash ekrani uchun).
  Future<bool> ping(String url) async {
    try {
      final r = await Dio(BaseOptions(connectTimeout: const Duration(seconds: 5)))
          .get('${normalizeUrl(url)}/api/v1/health/');
      return r.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref.watch(secureStoreProvider)));
