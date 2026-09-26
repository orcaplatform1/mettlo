import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final runningProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/running/overview') as Map<String, dynamic>);

class RunningPage extends ConsumerStatefulWidget {
  const RunningPage({super.key});
  @override
  ConsumerState<RunningPage> createState() => _RunningPageState();
}

class _RunningPageState extends ConsumerState<RunningPage> {
  final _km = TextEditingController();
  final _time = TextEditingController();
  String _type = 'EASY';
  bool _busy = false;

  static const _types = [
    ('EASY', 'Kolay'),
    ('TEMPO', 'Tempo'),
    ('INTERVAL', 'İnterval'),
    ('LONG', 'Uzun'),
    ('RACE', 'Yarış'),
  ];

  @override
  void dispose() {
    _km.dispose();
    _time.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final km = double.tryParse(_km.text.replaceAll(',', '.'));
    if (km == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Mesafe giriniz.')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/running/log', body: {
        'distanceKm': km,
        if (_time.text.isNotEmpty)
          'durationMinutes': int.tryParse(_time.text) ?? 0,
        'type': _type,
        'date': DateTime.now().toIso8601String().substring(0, 10),
      });
      ref.invalidate(runningProvider);
      _km.clear();
      _time.clear();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Koşu kaydedildi!')));
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
    final ov = ref.watch(runningProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Koşu Günlüğü')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(runningProvider),
        child: ListView(padding: const EdgeInsets.all(16), children: [
          AsyncBody(
            value: ov,
            onRetry: () => ref.invalidate(runningProvider),
            builder: (o) {
              final wk = (o['weekly'] as List?)?.lastOrNull as Map?;
              return GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.8,
                children: [
                  StatTile(
                      icon: Icons.directions_run,
                      value: '${wk?['actualKm'] ?? 0} km',
                      label: 'Bu hafta'),
                  StatTile(
                      icon: Icons.fitness_center_outlined,
                      value: '${(o['logs'] as List?)?.length ?? 0}',
                      label: 'Son 8 hf. koşu'),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Koşu Ekle',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _km,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Mesafe (km)'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _time,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Süre (dk, isteğe bağlı)'),
                    ),
                  ),
                ]),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _type,
                  items: _types
                      .map((t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)))
                      .toList(),
                  onChanged: (v) => setState(() => _type = v!),
                  decoration: const InputDecoration(labelText: 'Koşu tipi'),
                ),
                const SizedBox(height: 12),
                MettloButton(label: 'Kaydet', loading: _busy, onPressed: _add),
              ]),
            ),
          ),
          const SectionTitle('Son Koşular'),
          AsyncBody(
            value: ov,
            onRetry: () {},
            builder: (o) {
              final logs = (o['logs'] as List?) ?? [];
              return logs.isEmpty
                  ? const InfoBanner('Henüz koşu kaydın yok.')
                  : Column(
                      children: [
                        for (final l in logs.take(15).cast<Map<String, dynamic>>())
                          ListTile(
                            dense: true,
                            leading: const Icon(Icons.directions_run_outlined, size: 18),
                            title: Text(
                                '${l['distanceKm']} km${l['durationMinutes'] != null ? ' · ${l['durationMinutes']} dk' : ''}'),
                            subtitle: Text(l['date'] != null
                                ? DateFormat('d MMM y', 'tr')
                                    .format(DateTime.parse(l['date'] as String))
                                : ''),
                            trailing: l['type'] != null
                                ? Chip(
                                    label: Text(l['type'] as String,
                                        style: const TextStyle(fontSize: 10)),
                                    padding: EdgeInsets.zero,
                                  )
                                : null,
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
