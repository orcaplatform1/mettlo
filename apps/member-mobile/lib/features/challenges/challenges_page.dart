import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final challengesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/public/challenges?limit=30', auth: false)
        as Map<String, dynamic>);

final challengeDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) async =>
        await ref.watch(apiClientProvider).get('/public/challenges/$slug', auth: false)
            as Map<String, dynamic>);

class ChallengesPage extends ConsumerWidget {
  const ChallengesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(challengesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Challenge'lar")),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(challengesProvider),
        child: AsyncBody(
          value: list,
          onRetry: () => ref.invalidate(challengesProvider),
          builder: (data) {
            final items = (data['items'] as List?) ?? [];
            return items.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: InfoBanner('Aktif challenge yok.'),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final c = items[i] as Map<String, dynamic>;
                      return GestureDetector(
                        onTap: () => context.push('/challenges/${c['slug']}'),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(MettloRadius.card), border: Border.all(color: MettloColors.borderSubtle)),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: MettloColors.primary.withValues(alpha: .15), borderRadius: BorderRadius.circular(20)),
                              child: Text('${c['durationDays']} GÜN', style: const TextStyle(color: MettloColors.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .5)),
                            ),
                            const SizedBox(height: 10),
                            Text(c['title'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text('${(c['_count'] as Map?)?['participants'] ?? 0} katılımcı', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
                          ]),
                        ),
                      );
                    },
                  );
          },
        ),
      ),
    );
  }
}

class ChallengeDetailPage extends ConsumerWidget {
  const ChallengeDetailPage({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(challengeDetailProvider(slug));
    return Scaffold(
      appBar: AppBar(title: const Text('Challenge')),
      body: AsyncBody(
        value: detail,
        onRetry: () => ref.invalidate(challengeDetailProvider(slug)),
        builder: (c) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(c['title'] as String, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            Wrap(spacing: 8, children: [
              Pill('${c['durationDays']} gün'),
              Pill('${(c['_count'] as Map?)?['participants'] ?? 0} katılımcı'),
              if (c['branch'] != null) Pill(c['branch'] as String),
            ]),
            if (c['description'] != null) ...[
              const SizedBox(height: 14),
              Text(c['description'] as String,
                  style:
                      const TextStyle(color: MettloColors.textSecondary, height: 1.5)),
            ],
          ],
        ),
      ),
    );
  }
}
