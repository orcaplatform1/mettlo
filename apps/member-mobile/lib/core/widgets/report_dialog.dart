import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_controller.dart';
import '../network/api_client.dart';
import '../theme/tokens.dart';

const _kReasons = [
  'Uygunsuz içerik',
  'Taciz veya zorbalık',
  'Sahte hesap',
  'Spam',
  'Nefret söylemi',
  'Diğer',
];

class ReportDialog extends ConsumerStatefulWidget {
  const ReportDialog({super.key, required this.targetType, required this.targetId});
  final String targetType;
  final String targetId;

  @override
  ConsumerState<ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends ConsumerState<ReportDialog> {
  String? _reason;
  final _body = TextEditingController();
  bool _busy = false;
  bool _done = false;

  @override
  void dispose() {
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_reason == null) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/reports', body: {
        'targetType': widget.targetType,
        'targetId': widget.targetId,
        'reason': _reason,
        if (_body.text.trim().isNotEmpty) 'body': _body.text.trim(),
      });
      if (mounted) setState(() => _done = true);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
        Navigator.pop(context);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Şikayet Et'),
      content: _done
          ? Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.check_circle_outline, color: MettloColors.success, size: 48),
              const SizedBox(height: 12),
              const Text('Şikayetiniz alındı', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              const Text('Ekibimiz inceleyecek ve gerekli işlemi yapacak.', textAlign: TextAlign.center, style: TextStyle(color: MettloColors.textSecondary)),
            ])
          : SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Neden Şikayet ediyorsunuz?', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                for (final r in _kReasons)
                  RadioListTile<String>(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    value: r,
                    groupValue: _reason,
                    title: Text(r),
                    activeColor: MettloColors.primary,
                    onChanged: (v) => setState(() => _reason = v),
                  ),
                const SizedBox(height: 8),
                TextField(
                  controller: _body,
                  maxLines: 3,
                  maxLength: 2000,
                  decoration: const InputDecoration(hintText: 'Açıklama (isteğe bağlı)'),
                ),
              ]),
            ),
      actions: _done
          ? [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Kapat'))]
          : [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('İptal')),
              FilledButton(
                onPressed: (_reason == null || _busy) ? null : _send,
                child: _busy
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Gönder'),
              ),
            ],
    );
  }
}
