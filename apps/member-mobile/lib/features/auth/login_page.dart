import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/validation/validators.dart';
import '../../core/widgets/common.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _form = GlobalKey<FormState>();
  final _user = TextEditingController();
  final _pass = TextEditingController();
  final _totp = TextEditingController();
  bool _needTotp = false, _busy = false;
  String? _error;

  @override
  void dispose() {
    _user.dispose();
    _pass.dispose();
    _totp.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final r = await ref.read(authControllerProvider.notifier).login(_user.text, _pass.text, totp: _totp.text);
      if (r.needsTwoFactorSetup && mounted) {
        setState(() => _error = 'Koç ve yönetim hesapları için iki adımlı doğrulama (2FA) zorunludur. Kurulumu web sitesinden (mettlo.tr) yapıp tekrar giriş yap.');
      }
    } on ApiException catch (e) {
      if (e.code == 'TOTP_REQUIRED') {
        setState(() => _needTotp = true);
      } else if (e.code == 'TOTP_INVALID') {
        setState(() {
          _needTotp = true;
          _error = 'Doğrulama kodu hatalı. Güncel kodu gir.';
        });
      } else {
        setState(() => _error = e.status == 401 || e.status == 400 ? 'Kullanıcı adı veya şifre hatalı.' : e.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Form(
                  key: _form,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Center(child: Image.asset('assets/images/logo.png', width: 72)),
                    const SizedBox(height: 12),
                    const Center(child: Text('METTLO', style: TextStyle(letterSpacing: 6, fontWeight: FontWeight.w800, fontSize: 22))),
                    const SizedBox(height: 32),
                    Text('Tekrar hoş geldin', style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 6),
                    const Text('Kullanıcı adın ve şifrenle giriş yap.', style: TextStyle(color: MettloColors.textSecondary)),
                    const SizedBox(height: 24),
                    if (_error != null) ...[InfoBanner(_error!, error: true), const SizedBox(height: 16)],
                    TextFormField(
                      controller: _user,
                      autofillHints: const [AutofillHints.username],
                      autocorrect: false,
                      enableSuggestions: false,
                      textInputAction: TextInputAction.next,
                      validator: (v) => Validators.required(v, 'Kullanıcı adı'),
                      decoration: const InputDecoration(labelText: 'Kullanıcı adı', hintText: 'kullaniciadi'),
                    ),
                    const SizedBox(height: 16),
                    PasswordField(controller: _pass, textInputAction: _needTotp ? TextInputAction.next : TextInputAction.done, onSubmitted: (_) => _needTotp ? null : _submit(), validator: (v) => (v ?? '').isEmpty ? 'Şifre gerekli' : null),
                    if (_needTotp) ...[
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _totp,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        autofocus: true,
                        autofillHints: const [AutofillHints.oneTimeCode],
                        validator: (v) => RegExp(r'^\d{6}$').hasMatch(v ?? '') ? null : '6 haneli doğrulama kodunu gir',
                        decoration: const InputDecoration(labelText: 'Doğrulama kodu (2FA)', counterText: '', helperText: 'Authenticator uygulamandaki güncel kod'),
                      ),
                    ],
                    const SizedBox(height: 24),
                    MettloButton(label: 'Giriş Yap', loading: _busy, onPressed: _submit),
                    const SizedBox(height: 16),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Text('Hesabın yok mu? ', style: TextStyle(color: MettloColors.textSecondary)),
                      GestureDetector(onTap: () => context.go('/register'), child: const Text('Hemen Başla', style: TextStyle(color: MettloColors.secondary, fontWeight: FontWeight.w600))),
                    ]),
                    const SizedBox(height: 8),
                    TextButton(onPressed: () => launchUrl(Uri.parse('${Env.siteUrl}/login'), mode: LaunchMode.externalApplication), child: const Text('Web sitesinde aç')),
                  ]),
                ),
              ),
            ),
          ),
        ),
      );
}
