import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Token'lar cihazın güvenli deposunda (Keychain / Keystore) saklanır.
class TokenStore {
  const TokenStore([this._s = const FlutterSecureStorage()]);
  final FlutterSecureStorage _s;

  static const _at = 'mettlo_at';
  static const _rt = 'mettlo_rt';

  Future<String?> accessToken() => _s.read(key: _at);
  Future<String?> refreshToken() => _s.read(key: _rt);

  Future<void> save(String access, String? refresh) async {
    await _s.write(key: _at, value: access);
    if (refresh != null) await _s.write(key: _rt, value: refresh);
  }

  Future<void> clear() async {
    await _s.delete(key: _at);
    await _s.delete(key: _rt);
  }
}
