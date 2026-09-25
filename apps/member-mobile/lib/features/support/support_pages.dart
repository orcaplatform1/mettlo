import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

const _categories = {'account': 'Hesap', 'payment': 'Ödeme', 'subscription': 'Abonelik', 'technical': 'Teknik sorun', 'content': 'İçerik', 'live': 'Canlı ders', 'coaching': 'Koçluk', 'other': 'Diğer'};

/// Açık → Yanıtlandı → Kapatıldı; yanıttan sonra 48 saat dönüş yoksa Zaman aşımı (kapatıldı).
(String, Color) ticketStatus(String s) => switch (s) {
      'OPEN' => ('Açık', MettloColors.primary),
      'ANSWERED' => ('Yanıtlandı', MettloColors.success),
      'CLOSED' => ('Kapatıldı', MettloColors.textTertiary),
      'TIMED_OUT' => ('Zaman aşımı · kapatıldı', MettloColors.error),
      _ => (s, MettloColors.textTertiary),
    };

final ticketsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/support/tickets') as List<dynamic>);
final ticketProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async => await ref.watch(apiClientProvider).get('/support/tickets/$id') as Map<String, dynamic>);

class SupportListPage extends ConsumerWidget {
  const SupportListPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(ticketsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Destek Merkezi')),
      floatingActionButton: FloatingActionButton.extended(onPressed: () => context.push('/support/new'), backgroundColor: MettloColors.primary, icon: const Icon(Icons.add), label: const Text('Yeni Talep')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(ticketsProvider),
        child: ListView(padding: const EdgeInsets.all(20), children: [
          const Text('Yanıtlanan talebe 48 saat içinde dönüş yapmazsan talep otomatik kapanır.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 14),
          AsyncBody(
            value: list,
            onRetry: () => ref.invalidate(ticketsProvider),
            builder: (items) => items.isEmpty
                ? const InfoBanner('Henüz destek talebin yok.')
                : Column(children: [
                    for (final t in items)
                      Card(
                        child: ListTile(
                          onTap: () => context.push('/support/${t['id']}'),
                          title: Text('#${t['number']} · ${t['subject']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(_categories[t['category']] ?? '${t['category']}'),
                          trailing: Pill(ticketStatus(t['status'] as String).$1, color: ticketStatus(t['status'] as String).$2),
                        ),
                      ),
                  ]),
          ),
        ]),
      ),
    );
  }
}

class NewTicketPage extends ConsumerStatefulWidget {
  const NewTicketPage({super.key});
  @override
  ConsumerState<NewTicketPage> createState() => _NewTicketPageState();
}

class _NewTicketPageState extends ConsumerState<NewTicketPage> {
  final _form = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _body = TextEditingController();
  String _category = 'other';
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final r = await ref.read(apiClientProvider).post('/support/tickets', body: {'subject': _subject.text.trim(), 'category': _category, 'body': _body.text.trim()}) as Map<String, dynamic>;
      ref.invalidate(ticketsProvider);
      if (mounted) context.pushReplacement('/support/${r['id']}');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Yeni Destek Talebi')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _form,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              if (_error != null) ...[InfoBanner(_error!, error: true), const SizedBox(height: 14)],
              DropdownButtonFormField<String>(
                initialValue: _category,
                dropdownColor: MettloColors.surface2,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items: [for (final e in _categories.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
                onChanged: (v) => setState(() => _category = v ?? 'other'),
              ),
              const SizedBox(height: 14),
              TextFormField(controller: _subject, maxLength: 120, validator: (v) => (v ?? '').trim().length < 3 ? 'Konu en az 3 karakter olmalı' : null, decoration: const InputDecoration(labelText: 'Konu', counterText: '')),
              const SizedBox(height: 14),
              TextFormField(controller: _body, maxLines: 7, maxLength: 4000, validator: (v) => (v ?? '').trim().length < 5 ? 'Mesaj en az 5 karakter olmalı' : null, decoration: const InputDecoration(labelText: 'Mesajın', alignLabelWithHint: true)),
              const SizedBox(height: 16),
              MettloButton(label: 'Talebi Gönder', loading: _busy, onPressed: _submit),
            ]),
          ),
        ),
      );
}

class TicketPage extends ConsumerStatefulWidget {
  const TicketPage({super.key, required this.id});
  final String id;
  @override
  ConsumerState<TicketPage> createState() => _TicketPageState();
}

class _TicketPageState extends ConsumerState<TicketPage> {
  final _ctrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _reply() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/support/tickets/${widget.id}/messages', body: {'body': _ctrl.text.trim()});
      _ctrl.clear();
      ref.invalidate(ticketProvider(widget.id));
      ref.invalidate(ticketsProvider);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(ticketProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Destek Talebi')),
      body: AsyncBody(
        value: t,
        onRetry: () => ref.invalidate(ticketProvider(widget.id)),
        builder: (d) {
          final status = d['status'] as String;
          final closed = status == 'CLOSED' || status == 'TIMED_OUT';
          final hint = switch (status) {
            'OPEN' => 'Talebin destek ekibine ulaştı. En kısa sürede yanıtlanacak.',
            'ANSWERED' => 'Destek ekibi yanıtladı. 48 saat içinde dönüş yapmazsan talep zaman aşımıyla otomatik kapanır.',
            'CLOSED' => 'Bu talep kapatıldı. Yeni bir sorun için yeni talep oluşturabilirsin.',
            _ => '48 saat içinde yanıt verilmediği için talep zaman aşımı nedeniyle kapatıldı. Yeni talep oluşturabilirsin.',
          };
          return ListView(padding: const EdgeInsets.all(20), children: [
            Row(children: [Expanded(child: Text('#${d['number']} · ${d['subject']}', style: Theme.of(context).textTheme.titleLarge)), Pill(ticketStatus(status).$1, color: ticketStatus(status).$2)]),
            const SizedBox(height: 12),
            InfoBanner(hint),
            const SizedBox(height: 12),
            for (final m in d['messages'] as List)
              Align(
                alignment: m['from'] == 'me' ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  padding: const EdgeInsets.all(12),
                  constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .82),
                  decoration: BoxDecoration(color: m['from'] == 'me' ? MettloColors.primary.withValues(alpha: .16) : m['from'] == 'system' ? Colors.transparent : MettloColors.surface2, borderRadius: BorderRadius.circular(14), border: m['from'] == 'system' ? Border.all(color: MettloColors.borderSubtle) : null),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (m['from'] == 'support') const Text('Mettlo Destek', style: TextStyle(color: MettloColors.secondary, fontSize: 11.5, fontWeight: FontWeight.w700)),
                    Text(m['body'] as String, style: TextStyle(color: m['from'] == 'system' ? MettloColors.textTertiary : null)),
                  ]),
                ),
              ),
            if (!closed) ...[
              const SizedBox(height: 12),
              TextField(controller: _ctrl, maxLines: 4, maxLength: 4000, decoration: const InputDecoration(hintText: 'Yanıtını yaz…')),
              const SizedBox(height: 8),
              MettloButton(label: 'Yanıtla', loading: _busy, onPressed: _reply),
              TextButton(
                onPressed: () async {
                  await ref.read(apiClientProvider).post('/support/tickets/${widget.id}/close');
                  ref.invalidate(ticketProvider(widget.id));
                  ref.invalidate(ticketsProvider);
                },
                child: const Text('Sorunum çözüldü, talebi kapat'),
              ),
            ],
          ]);
        },
      ),
    );
  }
}
