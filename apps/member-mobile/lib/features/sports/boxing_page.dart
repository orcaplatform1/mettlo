import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final boxingProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/boxing/overview') as Map<String, dynamic>);

class BoxingPage extends ConsumerStatefulWidget {
  const BoxingPage({super.key});
  @override
  ConsumerState<BoxingPage> createState() => _BoxingPageState();
}

class _BoxingPageState extends ConsumerState<BoxingPage> {
  final _rounds = TextEditingController();
  String _type = 'TECHNICAL';
  bool _busy = false;

  static const _types = [
    ('TECHNICAL', 'Teknik'),
    ('SPARRING', 'Sparring'),
    ('CONDITIONING', 'Kondisyon'),
    ('BAG_WORK', 'Torba'),
  ];

  @override
  void dispose() {
    _rounds.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final rounds = int.tryParse(_rounds.text);
    if (rounds == null || rounds <= 0) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Round sayısı giriniz.')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/boxing/session', body: {
        'rounds': rounds,
        'sessionType': _type,
        'date': DateTime.now().toIso8601String().substring(0, 10),
      });
      ref.invalidate(boxingProvider);
      _rounds.clear();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Seans kaydedildi!')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ov = ref.watch(boxingProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Boks & Kickboks Günlüğü')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(boxingProvider),
        child: ListView(padding: const EdgeInsets.all(16), children: [
          AsyncBody(
            value: ov,
            onRetry: () => ref.invalidate(boxingProvider),
            builder: (o) {
              final totals = o['totals'] as Map<String, dynamic>? ?? {};
              return GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.8,
                children: [
                  StatTile(
                      icon: Icons.sports_mma,
                      value: '${totals['rounds'] ?? 0}',
                      label: 'Son 90 gün round'),
                  StatTile(
                      icon: Icons.timer_outlined,
                      value: '${totals['sessions'] ?? 0}',
                      label: 'Seans'),
                  StatTile(
                      icon: Icons.emoji_events_outlined,
                      value:
                          '${o['mastered'] ?? 0}/${(o['techniques'] as List?)?.length ?? 0}',
                      label: 'Öğrenilen teknik'),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Seans Ekle',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 12),
                TextField(
                  controller: _rounds,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Round sayısı'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _type,
                  items: _types
                      .map((t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)))
                      .toList(),
                  onChanged: (v) => setState(() => _type = v!),
                  decoration: const InputDecoration(labelText: 'Seans tipi'),
                ),
                const SizedBox(height: 12),
                MettloButton(label: 'Kaydet', loading: _busy, onPressed: _add),
              ]),
            ),
          ),
          const SectionTitle('Teknik İlerleme'),
          AsyncBody(
            value: ov,
            onRetry: () {},
            builder: (o) {
              final techs = (o['techniques'] as List?) ?? [];
              return techs.isEmpty
                  ? const InfoBanner(
                      'Abone olduğun boks koçunun teknik kütüphanesi burada görünür.')
                  : Column(
                      children: [
                        for (final t in techs.cast<Map<String, dynamic>>())
                          ListTile(
                            dense: true,
                            title: Text(t['name'] as String? ?? ''),
                            subtitle: Text(t['category'] as String? ?? '',
                                style: const TextStyle(fontSize: 11)),
                            trailing: Chip(
                              label: Text(
                                t['status'] == 'MASTERED'
                                    ? 'Öğrenildi'
                                    : t['status'] == 'IN_PROGRESS'
                                        ? 'Çalışılıyor'
                                        : 'Başlanmadı',
                                style: const TextStyle(fontSize: 10),
                              ),
                              backgroundColor: t['status'] == 'MASTERED'
                                  ? MettloColors.success.withValues(alpha: .15)
                                  : null,
                              padding: EdgeInsets.zero,
                            ),
                          ),
                      ],
                    );
            },
          ),
        ]),
      ),
    );
  }
}
