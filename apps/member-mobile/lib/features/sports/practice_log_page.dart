import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final practiceOverviewProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, branch) async =>
        await ref.watch(apiClientProvider).get('/practice/overview/$branch')
            as Map<String, dynamic>);

class PracticeLogPage extends ConsumerStatefulWidget {
  const PracticeLogPage({super.key, required this.branch, required this.title});
  final String branch;
  final String title;

  @override
  ConsumerState<PracticeLogPage> createState() => _PracticeLogPageState();
}

class _PracticeLogPageState extends ConsumerState<PracticeLogPage> {
  final _minutes = TextEditingController();
  final _notes = TextEditingController();
  int _mood = 3;
  bool _busy = false;

  @override
  void dispose() {
    _minutes.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final mins = int.tryParse(_minutes.text);
    if (mins == null || mins <= 0) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Süre giriniz.')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/practice/log', body: {
        'branch': widget.branch,
        'durationMinutes': mins,
        'moodAfter': _mood,
        if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
        'date': DateTime.now().toIso8601String().substring(0, 10),
      });
      ref.invalidate(practiceOverviewProvider(widget.branch));
      _minutes.clear();
      _notes.clear();
      setState(() => _mood = 3);
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
    final ov = ref.watch(practiceOverviewProvider(widget.branch));
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(practiceOverviewProvider(widget.branch)),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AsyncBody(
              value: ov,
              onRetry: () => ref.invalidate(practiceOverviewProvider(widget.branch)),
              builder: (o) {
                final stats = o['stats'] as Map<String, dynamic>? ?? {};
                final tiles = <Widget>[
                  StatTile(
                      icon: Icons.timer_outlined,
                      value: '${stats['weekMinutes'] ?? 0}',
                      label: 'Bu hafta dakika'),
                  StatTile(
                      icon: Icons.calendar_today_outlined,
                      value: '${stats['month30Count'] ?? 0}',
                      label: 'Son 30 gün seans'),
                  if (stats['avgMoodAfter'] != null)
                    StatTile(
                        icon: Icons.mood,
                        value: '${stats['avgMoodAfter']}/5',
                        label: 'Ortalama ruh hali'),
                  if (stats['totalCalories'] != null &&
                      (stats['totalCalories'] as num) > 0)
                    StatTile(
                        icon: Icons.local_fire_department,
                        value: '${stats['totalCalories']}',
                        label: 'Yakılan kalori'),
                ];
                return GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.8,
                  children: tiles,
                );
              },
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Yeni Seans Ekle',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _minutes,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Süre (dakika)',
                      prefixIcon: Icon(Icons.timer_outlined),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(children: [
                    const Text('Seans sonu ruh hali: '),
                    for (var i = 1; i <= 5; i++)
                      GestureDetector(
                        onTap: () => setState(() => _mood = i),
                        child: Icon(
                          i <= _mood ? Icons.star : Icons.star_border,
                          color: MettloColors.highlight,
                          size: 28,
                        ),
                      ),
                  ]),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _notes,
                    maxLines: 2,
                    maxLength: 500,
                    decoration: const InputDecoration(labelText: 'Notlar (isteğe bağlı)'),
                  ),
                  const SizedBox(height: 12),
                  MettloButton(label: 'Kaydet', loading: _busy, onPressed: _add),
                ]),
              ),
            ),
            const SectionTitle('Son Seanslar'),
            AsyncBody(
              value: ov,
              onRetry: () {},
              builder: (o) {
                final logs = (o['logs'] as List?) ?? [];
                return logs.isEmpty
                    ? const InfoBanner('Henüz seans kaydın yok.')
                    : Column(
                        children: [
                          for (final l in logs.take(20).cast<Map<String, dynamic>>())
                            ListTile(
                              dense: true,
                              leading: const Icon(Icons.fitness_center_outlined, size: 18),
                              title: Text('${l['durationMinutes']} dakika'),
                              subtitle: Text(l['date'] != null
                                  ? DateFormat('d MMM y', 'tr')
                                      .format(DateTime.parse(l['date'] as String))
                                  : ''),
                              trailing: l['moodAfter'] != null
                                  ? Text(
                                      '${'★' * (l['moodAfter'] as int)}',
                                      style:
                                          const TextStyle(color: MettloColors.highlight),
                                    )
                                  : null,
                            ),
                        ],
                      );
              },
            ),
          ],
        ),
      ),
    );
  }
}
