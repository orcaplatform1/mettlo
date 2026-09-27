import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

const _kPlacements = [
  ('FEED', 'Akış'),
  ('STORY', 'Hikaye'),
  ('SEARCH', 'Arama'),
  ('MAP', 'Harita'),
  ('BRANCH', 'Kategori'),
];

class NewAdPage extends ConsumerStatefulWidget {
  const NewAdPage({super.key, this.businessId});
  final String? businessId;

  @override
  ConsumerState<NewAdPage> createState() => _NewAdPageState();
}

class _NewAdPageState extends ConsumerState<NewAdPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _imageUrlCtrl = TextEditingController();
  final _headlineCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  final _ctaLabelCtrl = TextEditingController(text: 'Daha Fazla');
  final _ctaUrlCtrl = TextEditingController();
  final _startAtCtrl = TextEditingController();
  final _endAtCtrl = TextEditingController();
  final Set<String> _placements = {'FEED'};
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _imageUrlCtrl.dispose();
    _headlineCtrl.dispose();
    _bodyCtrl.dispose();
    _ctaLabelCtrl.dispose();
    _ctaUrlCtrl.dispose();
    _startAtCtrl.dispose();
    _endAtCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('tr'),
    );
    if (d != null) {
      ctrl.text = d.toIso8601String().substring(0, 10);
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_placements.isEmpty) {
      setState(() => _error = 'En az bir yerleşim seçmelisiniz.');
      return;
    }
    setState(() { _loading = true; _error = null; });

    final role = ref.read(authControllerProvider).user?.role ?? '';
    final ownerType = role == 'BUSINESS' ? 'BUSINESS' : 'COACH';

    final body = <String, dynamic>{
      'ownerType': ownerType,
      'placement': _placements.toList(),
      'creative': {
        'imageUrl': _imageUrlCtrl.text.trim(),
        'headline': _headlineCtrl.text.trim(),
        if (_bodyCtrl.text.trim().isNotEmpty) 'body': _bodyCtrl.text.trim(),
        'ctaLabel': _ctaLabelCtrl.text.trim().isEmpty ? 'Daha Fazla' : _ctaLabelCtrl.text.trim(),
        if (_ctaUrlCtrl.text.trim().isNotEmpty) 'ctaUrl': _ctaUrlCtrl.text.trim(),
      },
      if (_titleCtrl.text.trim().isNotEmpty) 'title': _titleCtrl.text.trim(),
      if (_startAtCtrl.text.isNotEmpty) 'startAt': _startAtCtrl.text,
      if (_endAtCtrl.text.isNotEmpty) 'endAt': _endAtCtrl.text,
      if (ownerType == 'BUSINESS' && widget.businessId != null) 'businessId': widget.businessId,
    };

    try {
      await ref.read(apiClientProvider).post('/advertising', body: body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reklam oluşturuldu. İnceleme sonrası yayına alınacak.')));
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
      appBar: AppBar(title: const Text('Yeni Reklam')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const InfoBanner('Reklam oluşturulduktan sonra inceleme sürecine girer. Onaylandığında yayına alınır.'),
            const SizedBox(height: 20),

            // Yerleşimler
            const Text('Yerleşimler', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final (value, label) in _kPlacements)
                  FilterChip(
                    label: Text(label),
                    selected: _placements.contains(value),
                    onSelected: (on) => setState(() => on ? _placements.add(value) : _placements.remove(value)),
                    selectedColor: MettloColors.primary.withValues(alpha: .2),
                    checkmarkColor: MettloColors.primary,
                    side: BorderSide(color: _placements.contains(value) ? MettloColors.primary : MettloColors.borderSubtle),
                  ),
              ],
            ),
            const SizedBox(height: 20),

            _FieldLabel('Reklam Başlığı (iç kullanım)', optional: true),
            _TextField(ctrl: _titleCtrl, hint: 'Örn: Nisan 2025 kampanyası'),
            const SizedBox(height: 16),

            _FieldLabel('Görsel URL'),
            _TextField(ctrl: _imageUrlCtrl, hint: 'https://...', validator: (v) => (v == null || v.trim().isEmpty) ? 'Görsel URL zorunludur.' : null),
            const SizedBox(height: 16),

            _FieldLabel('Başlık'),
            _TextField(ctrl: _headlineCtrl, hint: 'Reklam başlığı', validator: (v) => (v == null || v.trim().isEmpty) ? 'Başlık zorunludur.' : null),
            const SizedBox(height: 16),

            _FieldLabel('Açıklama', optional: true),
            _TextField(ctrl: _bodyCtrl, hint: 'Kısa açıklama', maxLines: 3),
            const SizedBox(height: 16),

            _FieldLabel('CTA Metni', optional: true),
            _TextField(ctrl: _ctaLabelCtrl, hint: 'Daha Fazla'),
            const SizedBox(height: 16),

            _FieldLabel('CTA URL', optional: true),
            _TextField(ctrl: _ctaUrlCtrl, hint: 'https://...'),
            const SizedBox(height: 16),

            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _FieldLabel('Başlangıç Tarihi', optional: true),
                _DateField(ctrl: _startAtCtrl, onTap: () => _pickDate(_startAtCtrl)),
              ])),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _FieldLabel('Bitiş Tarihi', optional: true),
                _DateField(ctrl: _endAtCtrl, onTap: () => _pickDate(_endAtCtrl)),
              ])),
            ]),
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
                  : const Text('Reklam Oluştur', style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label, {this.optional = false});
  final String label;
  final bool optional;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          if (optional) const Text(' (isteğe bağlı)', style: TextStyle(color: MettloColors.textMuted, fontSize: 12.5)),
        ]),
      );
}

class _TextField extends StatelessWidget {
  const _TextField({required this.ctrl, required this.hint, this.validator, this.maxLines = 1});
  final TextEditingController ctrl;
  final String hint;
  final String? Function(String?)? validator;
  final int maxLines;

  @override
  Widget build(BuildContext context) => TextFormField(
        controller: ctrl,
        validator: validator,
        maxLines: maxLines,
        minLines: 1,
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
      );
}

class _DateField extends StatelessWidget {
  const _DateField({required this.ctrl, required this.onTap});
  final TextEditingController ctrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AbsorbPointer(
          child: TextFormField(
            controller: ctrl,
            readOnly: true,
            decoration: InputDecoration(
              hintText: 'Tarih seç',
              hintStyle: const TextStyle(color: MettloColors.textMuted),
              suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18, color: MettloColors.textTertiary),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.borderSubtle)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.borderSubtle)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.primary)),
            ),
          ),
        ),
      );
}
