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
    setState(() { _busy = true; _error = null; });
    try {
      final r = await ref.read(authControllerProvider.notifier).login(_user.text, _pass.text, totp: _totp.text);
      if (r.needsTwoFactorSetup && mounted) {
        setState(() => _error = 'Bu hesap için 2FA zorunludur. Kurulumu mettlo.tr üzerinden yap.');
      }
    } on ApiException catch (e) {
      if (e.code == 'TOTP_REQUIRED') {
        setState(() => _needTotp = true);
      } else if (e.code == 'TOTP_INVALID') {
        setState(() { _needTotp = true; _error = 'Doğrulama kodu hatalı. Güncel kodu gir.'; });
      } else {
        setState(() => _error = e.status == 401 || e.status == 400 ? 'Kullanıcı adı veya şifre hatalı.' : e.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MettloColors.bg,
      body: Stack(
        children: [
          // Alt gradient aksan
          Positioned(
            bottom: 0, left: 0, right: 0, height: 380,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    MettloColors.primary.withValues(alpha: .10),
                    MettloColors.accent.withValues(alpha: .07),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(children: [
                    Image.asset('assets/images/logo.png', width: 52),
                    const SizedBox(height: 28),
                    // Form kartı
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: MettloColors.surface1,
                        borderRadius: BorderRadius.circular(MettloRadius.xl),
                        border: Border.all(color: MettloColors.borderSubtle),
                      ),
                      child: Form(
                        key: _form,
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          Text('Giriş Yap', style: Theme.of(context).textTheme.headlineMedium),
                          const SizedBox(height: 6),
                          const Text('Kullanıcı adın ve şifrenle devam et.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 14)),
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
                          PasswordField(
                            controller: _pass,
                            textInputAction: _needTotp ? TextInputAction.next : TextInputAction.done,
                            onSubmitted: (_) => _needTotp ? null : _submit(),
                            validator: (v) => (v ?? '').isEmpty ? 'Şifre gerekli' : null,
                          ),
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
                          MettloButton(label: 'Giriş Yap →', loading: _busy, onPressed: _submit),
                          const SizedBox(height: 16),
                          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            const Text('Hesabın yok mu? ', style: TextStyle(color: MettloColors.textSecondary, fontSize: 14)),
                            GestureDetector(
                              onTap: () => context.go('/register'),
                              child: const Text('Hemen Başla', style: TextStyle(color: MettloColors.secondary, fontWeight: FontWeight.w600, fontSize: 14)),
                            ),
                          ]),
                          const SizedBox(height: 20),
                          _Divider('veya'),
                          const SizedBox(height: 16),
                          _SocialButton(
                            label: 'Google ile devam et',
                            icon: _GoogleIcon(),
                            onPressed: () => launchUrl(Uri.parse('${Env.siteUrl}/login?provider=google'), mode: LaunchMode.externalApplication),
                          ),
                          const SizedBox(height: 10),
                          _SocialButton(
                            label: 'Apple ile devam et',
                            icon: const Icon(Icons.apple, color: Colors.white, size: 20),
                            onPressed: () => launchUrl(Uri.parse('${Env.siteUrl}/login?provider=apple'), mode: LaunchMode.externalApplication),
                          ),
                        ]),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      '© 2025 Mettlo. Tüm hakları saklıdır.',
                      style: TextStyle(color: MettloColors.textMuted, fontSize: 11),
                      textAlign: TextAlign.center,
                    ),
                  ]),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider(this.label);
  final String label;
  @override
  Widget build(BuildContext context) => Row(children: [
        const Expanded(child: Divider(color: MettloColors.borderSubtle)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(label, style: const TextStyle(color: MettloColors.textMuted, fontSize: 13)),
        ),
        const Expanded(child: Divider(color: MettloColors.borderSubtle)),
      ]);
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({required this.label, required this.icon, required this.onPressed});
  final String label;
  final Widget icon;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 48,
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: const Color(0x0FFFFFFF),
            side: const BorderSide(color: MettloColors.borderSubtle),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MettloRadius.md)),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            icon,
            const SizedBox(width: 10),
            Text(label, style: const TextStyle(color: MettloColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
          ]),
        ),
      );
}

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) => SizedBox(
        width: 20,
        height: 20,
        child: CustomPaint(painter: _GooglePainter()),
      );
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width / 2;
    final paint = Paint()..style = PaintingStyle.stroke..strokeWidth = 2.5;

    // Basit G harfi — Google renklerini kullan
    paint.color = const Color(0xFF4285F4); // mavi
    canvas.drawArc(Rect.fromCircle(center: c, radius: r - 1), 0.3, 4.5, false, paint);

    // Yatay çizgi
    paint.strokeWidth = 2.5;
    paint.color = const Color(0xFF4285F4);
    canvas.drawLine(Offset(c.dx, c.dy), Offset(c.dx + r - 1, c.dy), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
