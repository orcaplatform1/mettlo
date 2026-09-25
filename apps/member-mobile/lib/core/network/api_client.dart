import 'dart:async';

import 'package:dio/dio.dart';

import '../config/env.dart';
import '../auth/token_store.dart';

/// API hatası: sunucunun `message`, `code` ve alan bazlı `errors` bilgisini taşır.
class ApiException implements Exception {
  ApiException(this.message, {this.status, this.code, this.fieldErrors = const {}});
  final String message;
  final int? status;
  final String? code;
  final Map<String, String> fieldErrors;

  bool get isUnauthorized => status == 401;
  @override
  String toString() => message;
}

/// Mettlo API istemcisi. Erişim token'ı 401 dönerse refresh token ile TEK SEFER yenilenir (paralel istekler aynı yenilemeyi bekler).
class ApiClient {
  ApiClient(this._tokens, {required this.onSessionExpired})
      : _dio = Dio(BaseOptions(
          baseUrl: Env.apiBase,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'content-type': 'application/json'},
          validateStatus: (_) => true, // durum kodlarını kendimiz yorumlarız
        ));

  final Dio _dio;
  final TokenStore _tokens;
  final void Function() onSessionExpired;
  Completer<bool>? _refreshing;

  Future<dynamic> get(String path, {Map<String, dynamic>? query, bool auth = true}) => _send('GET', path, query: query, auth: auth);
  Future<dynamic> post(String path, {Object? body, bool auth = true}) => _send('POST', path, body: body, auth: auth);
  Future<dynamic> put(String path, {Object? body}) => _send('PUT', path, body: body);
  Future<dynamic> patch(String path, {Object? body}) => _send('PATCH', path, body: body);
  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(String method, String path, {Object? body, Map<String, dynamic>? query, bool auth = true, bool retried = false}) async {
    final token = auth ? await _tokens.accessToken() : null;
    Response<dynamic> res;
    try {
      res = await _dio.request<dynamic>(
        path,
        data: body,
        queryParameters: query,
        options: Options(method: method, headers: {if (token != null) 'authorization': 'Bearer $token'}),
      );
    } on DioException catch (e) {
      throw ApiException(_networkMessage(e));
    }

    if (res.statusCode == 401 && auth && !retried && await _tokens.refreshToken() != null) {
      if (await _refresh()) return _send(method, path, body: body, query: query, auth: auth, retried: true);
      onSessionExpired();
    }
    if ((res.statusCode ?? 500) >= 400) throw _toException(res);
    return res.data;
  }

  Future<bool> _refresh() async {
    final running = _refreshing;
    if (running != null) return running.future;
    final c = _refreshing = Completer<bool>();
    var ok = false;
    try {
      final rt = await _tokens.refreshToken();
      if (rt != null) {
        final res = await _dio.post<dynamic>('/auth/refresh', data: {'refreshToken': rt});
        final d = res.data;
        if (res.statusCode == 200 && d is Map && d['accessToken'] != null) {
          await _tokens.save(d['accessToken'] as String, d['refreshToken'] as String?);
          ok = true;
        } else {
          await _tokens.clear();
        }
      }
    } catch (_) {
      ok = false;
    }
    c.complete(ok);
    _refreshing = null;
    return ok;
  }

  ApiException _toException(Response<dynamic> res) {
    final data = res.data;
    var message = 'İşlem tamamlanamadı (${res.statusCode}).';
    String? code;
    final fields = <String, String>{};
    if (data is Map) {
      final m = data['message'];
      if (m is String) {
        message = m;
      } else if (m is Map) {
        if (m['message'] is String) message = m['message'] as String;
        code = m['code'] as String?;
      }
      code ??= data['code'] as String?;
      final errs = data['errors'];
      if (errs is List) {
        for (final e in errs) {
          if (e is Map) {
            final key = (e['path'] ?? 'form').toString().split('.').first;
            fields.putIfAbsent(key, () => (e['message'] ?? '').toString());
          }
        }
        if (errs.isNotEmpty && errs.first is Map) message = (errs.first as Map)['message']?.toString() ?? message;
      }
    }
    if (res.statusCode == 429) message = 'Çok fazla deneme yaptın. Lütfen biraz sonra tekrar dene.';
    return ApiException(message, status: res.statusCode, code: code, fieldErrors: fields);
  }

  String _networkMessage(DioException e) => switch (e.type) {
        DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout || DioExceptionType.sendTimeout => 'Bağlantı zaman aşımına uğradı.',
        DioExceptionType.connectionError => 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.',
        _ => 'Bir ağ hatası oluştu.',
      };
}
