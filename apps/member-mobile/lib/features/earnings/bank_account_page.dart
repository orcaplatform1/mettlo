import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

class BankAccountPage extends ConsumerStatefulWidget {
  const BankAccountPage({super.key});

  @override
  ConsumerState<BankAccountPage> createState() => _BankAccountPageState();
}

class _BankAccountPageState extends ConsumerState<BankAccountPage> {
  final _formKey = GlobalKey<FormState>();
  final _ibanCtrl = TextEditingController();
  final _holderCtrl = TextEditingController();
  final _bankCtrl = TextEditingController();
  String _ibanPreview = '';
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _ibanCtrl.dispose();
    _holderCtrl.dispose();
    _bankCtrl.dispose();
    super.dispose();
  }

  void _onIbanChange(String raw) {
    final clean = raw.replaceAll(' ', '').toUpperCase();
    setState(() {
      if (clean.length >= 8) {
        final masked = '${clean.substring(0, 4)} **** **** **** ${clean.length >= 26 ? clean.substring(22) : ''}';
        _ibanPreview = masked;
      } else {
        _ibanPreview = '';
      }
    });
  }

  String? _validateIban(String? value) {
    if (value == null || value.isEmpty) return 'IBAN zorunludur.';
    final clean = value.replaceAll(' ', '').toUpperCase();
    if (!RegExp(r'^TR\d{24}$').hasMatch(clean)) return 'Geçersiz IBAN. TR ile başlayan 26 karakterli IBAN girin.';
    return null;
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _loading = true; _error = null; });
    try {
      final cleanIban = _ibanCtrl.text.replaceAll(' ', '').toUpperCase();
      await ref.read(apiClientProvider).post('/payout-accounts', body: {
        'iban': cleanIban,
        'accountHolderName': _holderCtrl.text.trim(),
        if (_bankCtrl.text.trim().isNotEmpty) 'bankName': _bankCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Banka hesabı başarıyla eklendi.')));
        context.pop();
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Banka Hesabı Ekle')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFf59e0b).withValues(alpha: .10),
                borderRadius: BorderRadius.circular(MettloRadius.card),
                border: Border.all(color: const Color(0xFFf59e0b).withValues(alpha: .4)),
              ),
              child: const Text.rich(
                TextSpan(children: [
                  TextSpan(text: '⚠ Önemli: ', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFd97706))),
                  TextSpan(text: 'Yalnızca kendi adınıza kayıtlı banka hesabına ödeme yapılır. Başkasına ait IBAN girilmesi durumunda ödeme gerçekleştirilmez ve hesabınız askıya alınabilir.', style: TextStyle(color: MettloColors.textSecondary, height: 1.5, fontSize: 13.5)),
                ]),
              ),
            ),
            const SizedBox(height: 24),
            _Field(
              label: 'IBAN',
              hint: 'TR00 0000 0000 0000 0000 0000 00',
              controller: _ibanCtrl,
              validator: _validateIban,
              onChanged: _onIbanChange,
              keyboardType: TextInputType.text,
              autocorrect: false,
            ),
            if (_ibanPreview.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text('IBAN önizleme: $_ibanPreview', style: const TextStyle(color: MettloColors.textMuted, fontSize: 12.5)),
            ],
            const SizedBox(height: 16),
            _Field(
              label: 'Hesap Sahibi Adı',
              hint: 'Ad Soyad',
              controller: _holderCtrl,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Hesap sahibi adı zorunludur.' : null,
            ),
            const SizedBox(height: 16),
            _Field(
              label: 'Banka Adı (isteğe bağlı)',
              hint: 'Örn: Ziraat Bankası',
              controller: _bankCtrl,
            ),
            const SizedBox(height: 24),
            if (_error != null) ...[
              InfoBanner(_error!, error: true),
              const SizedBox(height: 16),
            ],
            FilledButton(
              onPressed: _loading ? null : _submit,
              style: FilledButton.styleFrom(backgroundColor: MettloColors.primary, padding: const EdgeInsets.symmetric(vertical: 14)),
              child: _loading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Banka Hesabını Kaydet', style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.hint, required this.controller, this.validator, this.onChanged, this.keyboardType, this.autocorrect = true});
  final String label, hint;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final TextInputType? keyboardType;
  final bool autocorrect;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      const SizedBox(height: 6),
      TextFormField(
        controller: controller,
        validator: validator,
        onChanged: onChanged,
        keyboardType: keyboardType,
        autocorrect: autocorrect,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: MettloColors.textMuted),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.borderSubtle)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.borderSubtle)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.primary)),
          errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.error)),
          focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.error)),
        ),
      ),
    ]);
  }
}
