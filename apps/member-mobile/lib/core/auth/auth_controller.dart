import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import 'token_store.dart';

enum AuthStatus { unknown, signedOut, signedIn }

@immutable
class SessionUser {
  const SessionUser({required this.id, required this.username, required this.name, required this.role, this.avatarUrl, this.email});
  final String id, username, name, role;
  final String? avatarUrl, email;

  factory SessionUser.fromJson(Map<String, dynamic> j) => SessionUser(
        id: j['id'] as String,
        username: j['username'] as String,
        name: (j['name'] ?? j['username']) as String,
        role: j['role'] as String,
        avatarUrl: j['avatarUrl'] as String?,
        email: j['email'] as String?,
      );
}

@immutable
class AuthState {
  const AuthState(this.status, [this.user]);
  final AuthStatus status;
  final SessionUser? user;
}

class LoginResult {
  const LoginResult.ok() : needsTwoFactorSetup = false;
  const LoginResult.setupRequired() : needsTwoFactorSetup = true;
  final bool needsTwoFactorSetup;
}

final tokenStoreProvider = Provider<TokenStore>((_) => const TokenStore());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(tokenStoreProvider), onSessionExpired: () => ref.read(authControllerProvider.notifier).expire());
});

/// Oturum durumu: uygulama açılışında token varsa /auth/me ile doğrulanır.
class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(bootstrap);
    return const AuthState(AuthStatus.unknown);
  }

  ApiClient get _api => ref.read(apiClientProvider);
  TokenStore get _tokens => ref.read(tokenStoreProvider);

  Future<void> bootstrap() async {
    if (await _tokens.accessToken() == null && await _tokens.refreshToken() == null) {
      state = const AuthState(AuthStatus.signedOut);
      return;
    }
    try {
      final me = await _api.get('/auth/me') as Map<String, dynamic>;
      state = AuthState(AuthStatus.signedIn, SessionUser.fromJson(me));
    } on ApiException catch (e) {
      if (e.isUnauthorized || e.status == 403) await _tokens.clear();
      state = const AuthState(AuthStatus.signedOut);
    }
  }

  /// Giriş KULLANICI ADI ile yapılır. Koç/yönetim hesaplarında 2FA kodu gerekir (ApiException.code == TOTP_REQUIRED).
  Future<LoginResult> login(String username, String password, {String? totp}) async {
    final res = await _api.post('/auth/login', auth: false, body: {'username': username.trim().toLowerCase(), 'password': password, if (totp != null && totp.isNotEmpty) 'totp': totp}) as Map<String, dynamic>;
    if (res['status'] == '2fa_setup_required') return const LoginResult.setupRequired();
    await _tokens.save(res['accessToken'] as String, res['refreshToken'] as String?);
    state = AuthState(AuthStatus.signedIn, SessionUser.fromJson(res['user'] as Map<String, dynamic>));
    return const LoginResult.ok();
  }

  Future<void> register(Map<String, dynamic> body) async {
    await _api.post('/auth/register', auth: false, body: body);
    await login(body['username'] as String, body['password'] as String);
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {/* oturum zaten kapalı olabilir */}
    await _tokens.clear();
    state = const AuthState(AuthStatus.signedOut);
  }

  void expire() {
    _tokens.clear();
    state = const AuthState(AuthStatus.signedOut);
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
