import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final myProgramsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/programs') as List<dynamic>);

class ProgramsPage extends ConsumerWidget {
  const ProgramsPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(myProgramsProvider);
    return RefreshIndicator(
      color: MettloColors.primary,
      onRefresh: () async => ref.invalidate(myProgramsProvider),
      child: ListView(padding: const EdgeInsets.all(20), children: [
        Text('Programlarım', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 14),
        AsyncBody(
          value: list,
          onRetry: () => ref.invalidate(myProgramsProvider),
          builder: (items) {
            if (items.isEmpty) {
              return Column(children: [
                const InfoBanner('Henüz bir programa başlamadın. Abone olduğun koçların programlarını koçun profilinden ya da web sitesinden başlatabilirsin.'),
                const SizedBox(height: 12),
                MettloButton(label: 'Koçları Keşfet', onPressed: () => context.go('/discover')),
              ]);
            }
            return Column(children: [
              for (final e in items)
                Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(MettloRadius.card),
                    onTap: () => context.push('/program/${e['program']['slug']}'),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Pill('${e['program']['durationDays']} gün'),
                        const SizedBox(height: 8),
                        Text(e['program']['title'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        Text('@${e['program']['creator']['username']}', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
                        const SizedBox(height: 12),
                        ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: ((num.tryParse('${e['progressPct']}') ?? 0) / 100).clamp(0, 1).toDouble(), minHeight: 8, color: MettloColors.primary, backgroundColor: MettloColors.surface2)),
                        const SizedBox(height: 6),
                        Text('%${num.tryParse('${e['progressPct']}') ?? 0} · ${e['completedAt'] != null ? 'Tamamlandı 🎉' : 'Sıradaki gün: ${e['currentDay']}'}', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 12.5)),
                      ]),
                    ),
                  ),
                ),
            ]);
          },
        ),
      ]),
    );
  }
}
