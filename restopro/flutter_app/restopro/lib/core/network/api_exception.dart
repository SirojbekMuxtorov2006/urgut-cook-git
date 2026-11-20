import 'package:dio/dio.dart';

/// Backend xatolari {error, detail} formatida keladi.
class ApiException implements Exception {
  ApiException(this.message, {this.code, this.status, this.fields});

  final String message;
  final String? code;
  final int? status;
  final Map<String, dynamic>? fields;

  bool get isNetwork => status == null;
  bool get isUnauthorized => status == 401;

  factory ApiException.fromDio(DioException e) {
    final res = e.response;
    if (res == null) {
      return ApiException("Server bilan aloqa yo'q. Internet yoki server manzilini tekshiring.");
    }
    final data = res.data;
    String message = 'Xatolik (${res.statusCode})';
    String? code;
    Map<String, dynamic>? fields;
    if (data is Map) {
      code = data['error']?.toString();
      final detail = data['detail'];
      if (detail is String) {
        message = detail;
      } else if (detail is Map) {
        fields = Map<String, dynamic>.from(detail);
        message = fields.entries.map((e) => e.value is List ? (e.value as List).join(', ') : '${e.value}').join('\n');
      } else if (detail is List) {
        message = detail.join('\n');
      }
    }
    return ApiException(message, code: code, status: res.statusCode, fields: fields);
  }

  @override
  String toString() => message;
}
