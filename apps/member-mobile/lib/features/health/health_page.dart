import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final healthSummaryProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/health/summary', query: {'days': 30}) as Map<String, dynamic>);

/// Sağlık verisi elle girilir. (Apple Health / Health Connect otomatik senkronu, platform izinleri ve
/// mağaza yapılandırması tamamlanınca `health` paketiyle eklenecek; aynı API uçları kullanılır.)
class HealthPage extends ConsumerWidget {
  const HealthPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final h = ref.watch(healthSummaryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Sağlık & İlerleme')),
      body: AsyncBody(
        value: h,
        onRetry: () => ref.invalidate(healthSummaryProvider),
        builder: (d) {
          final avg = d['averages'] as Map<String, dynamic>;
          final ms = d['measurements'] as List;
          final sleep = avg['sleepMin'] as num?;
          return ListView(padding: const EdgeInsets.all(20), children: [
            const Text('Verilerini yalnızca izin verdiğin koçla paylaşırsın (Profil > Sağlık verisi paylaşımı).', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
            const SizedBox(height: 14),
            GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.7, children: [
              StatTile(icon: Icons.directions_walk, value: '${avg['steps'] ?? '—'}', label: 'Ort. günlük adım'),
              StatTile(icon: Icons.local_fire_department_outlined, value: '${avg['activeCalories'] ?? '—'}', label: 'Ort. aktif kalori'),
              StatTile(icon: Icons.bedtime_outlined, value: sleep == null ? '—' : '${sleep ~/ 60} sa ${(sleep % 60).toInt()} dk', label: 'Ort. uyku'),
              StatTile(icon: Icons.monitor_weight_outlined, value: ms.isNotEmpty && ms.first['weightKg'] != null ? '${ms.first['weightKg']} kg' : '—', label: 'Son kilo'),
            ]),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: MettloButton(label: 'Aktivite ekle', secondary: true, icon: Icons.add, onPressed: () => _activity(context, ref))),
              const SizedBox(width: 10),
              Expanded(child: MettloButton(label: 'Ölçü ekle', secondary: true, icon: Icons.straighten, onPressed: () => _measurement(context, ref))),
            ]),
            const SectionTitle('Son aktiviteler'),
            if ((d['activity'] as List).isEmpty) const Text('Kayıt yok.', style: TextStyle(color: MettloColors.textMuted)),
            for (final a in (d['activity'] as List).take(14))
              Card(child: ListTile(dense: true, title: Text(_d(a['date'])), subtitle: Text('${a['steps'] ?? '—'} adım · ${a['activeCalories'] ?? '—'} kcal · ${a['exerciseMin'] ?? '—'} dk'))),
          ]);
        },
      ),
    );
  }

  static String _d(dynamic iso) {
    final d = DateTime.tryParse('$iso')?.toLocal();
    return d == null ? '' : '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
  }

  Future<void> _activity(BuildContext context, WidgetRef ref) async {
    final steps = TextEditingController(), cal = TextEditingController(), mins = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bugünkü aktivite'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: steps, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Adım')),
          const SizedBox(height: 10),
          TextField(controller: cal, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Aktif kalori')),
          const SizedBox(height: 10),
          TextField(controller: mins, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Egzersiz (dk)')),
        ]),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Vazgeç')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Kaydet'))],
      ),
    );
    if (ok == true) {
      int? n(TextEditingController c) => int.tryParse(c.text.trim());
      try {
        await ref.read(apiClientProvider).put('/me/health/activity', body: [
          {'date': DateTime.now().toIso8601String().substring(0, 10), 'steps': n(steps), 'activeCalories': n(cal), 'exerciseMin': n(mins)}..removeWhere((_, v) => v == null),
        ]);
        ref.invalidate(healthSummaryProvider);
      } on ApiException catch (e) {
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
    for (final c in [steps, cal, mins]) {
      c.dispose();
    }
  }

  Future<void> _measurement(BuildContext context, WidgetRef ref) async {
    final kg = TextEditingController(), waist = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Vücut ölçüsü'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: kg, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Kilo (kg)')),
          const SizedBox(height: 10),
          TextField(controller: waist, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Bel (cm)')),
        ]),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Vazgeç')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Kaydet'))],
      ),
    );
    if (ok == true) {
      double? n(TextEditingController c) => double.tryParse(c.text.trim().replaceAll(',', '.'));
      final body = <String, dynamic>{'weightKg': n(kg), 'waistCm': n(waist)}..removeWhere((_, v) => v == null);
      try {
        await ref.read(apiClientProvider).post('/me/health/measurements', body: body);
        ref.invalidate(healthSummaryProvider);
      } on ApiException catch (e) {
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
    kg.dispose();
    waist.dispose();
  }
}
