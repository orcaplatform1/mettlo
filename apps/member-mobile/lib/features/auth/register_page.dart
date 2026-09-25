import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/validation/validators.dart';
import '../../core/widgets/common.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});
  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _pass = TextEditingController();
  final _pass2 = TextEditingController();
  DateTime? _birth;
  bool _terms = false, _kvkk = false, _marketing = false, _busy = false, _submitted = false;
  String? _error;
  Map<String, String> _server = {};

  @override
  void dispose() {
    for (final c in [_name, _username, _email, _phone, _pass, _pass2]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickBirth() async {
    final now = DateTime.now();
    final d = await showDatePicker(context: context, initialDate: _birth ?? DateTime(now.year - 25), firstDate: DateTime(1920), lastDate: now, helpText: 'Doğum tarihi', locale: const Locale('tr'));
    if (d != null) setState(() => _birth = d);
  }

  Future<void> _submit() async {
    setState(() => _submitted = true);
    if (!_form.currentState!.validate() || Validators.birthDate(_birth) != null || !_terms || !_kvkk) return;
    setState(() {
      _busy = true;
      _error = null;
      _server = {};
    });
    try {
      await ref.read(authControllerProvider.notifier).register({
        'name': _name.text.trim(),
        'username': _username.text.trim().toLowerCase(),
        'email': _email.text.trim().toLowerCase(),
        'phone': _phone.text.trim(),
        'password': _pass.text,
        'birthDate': DateFormat('yyyy-MM-dd').format(_birth!),
        'acceptTerms': true,
        'acceptKvkk': true,
        'marketingConsent': _marketing,
      });
    } on ApiException catch (e) {
      setState(() {
        _server = e.fieldErrors;
        _error = e.fieldErrors.isEmpty ? e.message : null;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final birthError = _submitted ? Validators.birthDate(_birth) : null;
    return Scaffold(
      appBar: AppBar(leading: BackButton(onPressed: () => context.go('/login')), title: const Text('Mettlo\'ya katıl')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _form,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              if (_error != null) ...[InfoBanner(_error!, error: true), const SizedBox(height: 16)],
              TextFormField(controller: _name, textCapitalization: TextCapitalization.words, autofillHints: const [AutofillHints.name], validator: (v) => (v ?? '').trim().length < 2 ? 'Ad soyad gerekli' : _server['name'], decoration: const InputDecoration(labelText: 'Ad Soyad')),
              const SizedBox(height: 16),
              TextFormField(
                controller: _username,
                autocorrect: false,
                enableSuggestions: false,
                maxLength: 30,
                inputFormatters: [_UsernameFormatter()],
                onChanged: (_) => setState(() {}),
                validator: (v) => Validators.username(v) ?? _server['username'],
                decoration: InputDecoration(labelText: 'Kullanıcı adı', counterText: '', helperMaxLines: 3, helperText: 'Profil adresin: mettlo.tr/profile/${_username.text.isEmpty ? 'kullaniciadi' : _username.text} · Girişte de bunu kullanacaksın'),
              ),
              const SizedBox(height: 16),
              PasswordField(controller: _pass, validator: (v) => Validators.password(v) ?? _server['password']),
              const SizedBox(height: 16),
              PasswordField(controller: _pass2, label: 'Şifre (tekrar)', validator: (v) => (v ?? '') != _pass.text ? 'Şifreler eşleşmiyor' : null),
              const SizedBox(height: 16),
              TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], validator: (v) => Validators.email(v) ?? _server['email'], decoration: const InputDecoration(labelText: 'E-posta', hintText: 'ornek@eposta.com')),
              const SizedBox(height: 16),
              PhoneField(controller: _phone, validator: (v) => Validators.phone(v) ?? _server['phone']),
              const SizedBox(height: 16),
              InkWell(
                onTap: _pickBirth,
                borderRadius: BorderRadius.circular(MettloRadius.md),
                child: InputDecorator(
                  decoration: InputDecoration(labelText: 'Doğum tarihi', errorText: birthError ?? _server['birthDate'], helperText: 'Mettlo 18 yaş ve üzeri içindir. 18 yaşından küçükler yalnızca ebeveyn / yasal vasi kaydı ile üye olabilir.', helperMaxLines: 3, suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18)),
                  child: Text(_birth == null ? 'Seç' : DateFormat('dd.MM.yyyy').format(_birth!), style: TextStyle(color: _birth == null ? MettloColors.textMuted : MettloColors.textPrimary)),
                ),
              ),
              const SizedBox(height: 16),
              _Check(value: _terms, onChanged: (v) => setState(() => _terms = v), error: _submitted && !_terms, child: const _LinkText('Kullanım Koşulları', '/terms', suffix: '\'nı okudum, kabul ediyorum.')),
              _Check(value: _kvkk, onChanged: (v) => setState(() => _kvkk = v), error: _submitted && !_kvkk, child: const _LinkText('KVKK Aydınlatma Metni', '/data-protection', suffix: '\'ni okudum.')),
              _Check(value: _marketing, onChanged: (v) => setState(() => _marketing = v), child: const Text('Kampanya ve duyurular için e-posta / SMS almak istiyorum. (isteğe bağlı)', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13.5))),
              const SizedBox(height: 16),
              MettloButton(label: 'Hesap Oluştur', loading: _busy, onPressed: _submit),
            ]),
          ),
        ),
      ),
    );
  }
}

class _UsernameFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final t = newValue.text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9_]'), '');
    return TextEditingValue(text: t, selection: TextSelection.collapsed(offset: t.length));
  }
}

class _Check extends StatelessWidget {
  const _Check({required this.value, required this.onChanged, required this.child, this.error = false});
  final bool value, error;
  final ValueChanged<bool> onChanged;
  final Widget child;
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () => onChanged(!value),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(value: value, onChanged: (v) => onChanged(v ?? false), side: BorderSide(color: error ? MettloColors.error : MettloColors.textMuted), activeColor: MettloColors.primary),
            const SizedBox(width: 4),
            Expanded(child: Padding(padding: const EdgeInsets.only(top: 12), child: child)),
          ]),
        ),
      );
}

class _LinkText extends StatelessWidget {
  const _LinkText(this.text, this.path, {required this.suffix});
  final String text, path, suffix;
  @override
  Widget build(BuildContext context) => Text.rich(
        TextSpan(style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5), children: [
          WidgetSpan(child: GestureDetector(onTap: () => launchUrl(Uri.parse('${Env.siteUrl}$path'), mode: LaunchMode.externalApplication), child: Text(text, style: const TextStyle(color: MettloColors.secondary, fontSize: 13.5)))),
          TextSpan(text: suffix),
        ]),
      );
}
