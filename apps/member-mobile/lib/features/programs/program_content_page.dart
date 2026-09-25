import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';
import '../home/home_page.dart';
import 'programs_page.dart';

final programContentProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) async => await ref.watch(apiClientProvider).get('/programs/$slug/content') as Map<String, dynamic>);

/// Program içeriği yalnızca erişimi olanlara (abone / ücretsiz program) açılır; sunucu 403 döner.
class ProgramContentPage extends ConsumerWidget {
  const ProgramContentPage({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = ref.watch(programContentProvider(slug));
    return Scaffold(
      appBar: AppBar(title: const Text('Program')),
      body: c.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) => Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException && e.status == 403 ? 'Bu içerik abonelere özel. Erişmek için koça abone ol.' : (e is ApiException ? e.message : 'Bir hata oluştu.'), error: true)),
        data: (d) => _Content(d: d, slug: slug),
      ),
    );
  }
}

class _Content extends ConsumerWidget {
  const _Content({required this.d, required this.slug});
  final Map<String, dynamic> d;
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enr = d['enrollment'] as Map<String, dynamic>?;
    return ListView(padding: const EdgeInsets.all(20), children: [
      Text(d['title'] as String, style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 12),
      if (enr != null) ...[
        ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: ((num.tryParse('${enr['progressPct']}') ?? 0) / 100).clamp(0, 1).toDouble(), minHeight: 8, color: MettloColors.primary, backgroundColor: MettloColors.surface2)),
        const SizedBox(height: 6),
        Text('%${num.tryParse('${enr['progressPct']}') ?? 0} · sıradaki gün ${enr['currentDay']}', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 12.5)),
      ] else
        MettloButton(label: 'Programa Başla', onPressed: () async {
          await ref.read(apiClientProvider).post('/programs/$slug/enroll');
          ref.invalidate(programContentProvider(slug));
          ref.invalidate(myProgramsProvider);
        }),
      const SizedBox(height: 12),
      for (final w in d['weeks'] as List)
        Card(
          child: ExpansionTile(
            initiallyExpanded: w['weekNo'] == 1,
            shape: const Border(),
            title: Text('${w['weekNo']}. Hafta${w['title'] != null ? ' — ${w['title']}' : ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            children: [for (final day in w['days'] as List) _Day(day: day as Map<String, dynamic>, slug: slug)],
          ),
        ),
    ]);
  }
}

class _Day extends StatelessWidget {
  const _Day({required this.day, required this.slug});
  final Map<String, dynamic> day;
  final String slug;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Text('Gün ${day['dayNo']}${day['title'] != null ? ' · ${day['title']}' : ''}', style: const TextStyle(fontWeight: FontWeight.w700)), if (day['isRest'] == true) const Padding(padding: EdgeInsets.only(left: 8), child: Pill('Dinlenme'))]),
          if (day['notes'] != null) Text(day['notes'] as String, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
          for (final w in day['workouts'] as List) _Workout(w: (w as Map)['workout'] as Map<String, dynamic>, slug: slug),
        ]),
      );
}

class _Workout extends ConsumerWidget {
  const _Workout({required this.w, required this.slug});
  final Map<String, dynamic> w;
  final String slug;

  String _blockName(String t) => switch (t) { 'STRENGTH' => 'Kuvvet', 'TIMED_FLOW' => 'Akış', 'CARDIO' => 'Kardiyo', _ => 'Serbest' };

  @override
  Widget build(BuildContext context, WidgetRef ref) => Container(
        margin: const EdgeInsets.only(top: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: MettloColors.surface2, borderRadius: BorderRadius.circular(MettloRadius.lg)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Expanded(child: Text(w['title'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))), if (w['durationMin'] != null) Text('${w['durationMin']} dk', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12))]),
          for (final b in w['blocks'] as List) ...[
            const SizedBox(height: 10),
            Text('${_blockName(b['type'] as String).toUpperCase()}${b['title'] != null ? ' · ${b['title']}' : ''}', style: const TextStyle(color: MettloColors.secondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8)),
            if (b['config'] != null) Text((b['config'] as Map).entries.map((e) => '${e.key}: ${e.value}').join(' · '), style: const TextStyle(color: MettloColors.textSecondary, fontSize: 12.5)),
            for (final x in b['exercises'] as List)
              Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Text('${x['exercise']['name']} — ${[if (x['sets'] != null) '${x['sets']} set', if (x['reps'] != null) '${x['reps']} tekrar', if (x['weightKg'] != null) '${x['weightKg']} kg', if (x['restSec'] != null) '${x['restSec']} sn dinlenme'].join(' · ')}', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
              ),
          ],
          const SizedBox(height: 12),
          MettloButton(label: 'Tamamladım', onPressed: () => _log(context, ref)),
        ]),
      );

  Future<void> _log(BuildContext context, WidgetRef ref) async {
    final ctrl = TextEditingController();
    final minutes = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Antrenmanı kaydet'),
        content: TextField(controller: ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Süre (dakika)')),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Vazgeç')), TextButton(onPressed: () => Navigator.pop(ctx, ctrl.text), child: const Text('Kaydet'))],
      ),
    );
    ctrl.dispose();
    if (minutes == null) return;
    try {
      final min = int.tryParse(minutes);
      final r = await ref.read(apiClientProvider).post('/workouts/${w['id']}/log', body: {if (min != null && min > 0) 'durationSec': min * 60}) as Map<String, dynamic>;
      ref.invalidate(programContentProvider(slug));
      ref.invalidate(myProgramsProvider);
      ref.invalidate(gamificationProvider);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Antrenman kaydedildi · +${r['xp']} XP')));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}
