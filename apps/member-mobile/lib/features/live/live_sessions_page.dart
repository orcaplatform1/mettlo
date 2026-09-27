import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final publicLiveProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/public/live?limit=30', auth: false);
  return res as Map<String, dynamic>;
});

class LiveSessionsPublicPage extends ConsumerWidget {
  const LiveSessionsPublicPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(publicLiveProvider);
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
              decoration: const BoxDecoration(gradient: MettloColors.heroGradient),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('CANLI', style: TextStyle(color: MettloColors.primary, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Text('Gerçek zamanlı dersler', style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 28)),
                const SizedBox(height: 8),
                const Text('Koçlarının canlı derslerine katıl. Aktif abonelik ile erişim sağlanır.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 15, height: 1.5)),
              ]),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            sliver: data.when(
              loading: () => const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: MettloColors.primary)))),
              error: (e, _) => SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: InfoBanner(e is ApiException ? e.message : 'Yüklenemedi.', error: true))),
              data: (d) {
                final items = (d['items'] as List?) ?? [];
                if (items.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Column(children: [
                        Icon(Icons.radio_outlined, size: 48, color: MettloColors.textMuted),
                        SizedBox(height: 16),
                        Text('Planlanmış canlı ders yok', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                        SizedBox(height: 8),
                        Text('Yeni dersler planlandığında burada görünecek.', style: TextStyle(color: MettloColors.textSecondary), textAlign: TextAlign.center),
                      ]),
                    ),
                  );
                }
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _LiveCard(items[i] as Map<String, dynamic>)),
                    childCount: items.length,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveCard extends StatelessWidget {
  const _LiveCard(this.session);
  final Map<String, dynamic> session;

  @override
  Widget build(BuildContext context) {
    final title = session['title'] as String? ?? '';
    final status = session['status'] as String? ?? 'SCHEDULED';
    final scheduledAt = DateTime.tryParse(session['scheduledAt'] as String? ?? '')?.toLocal();
    final durationMin = session['durationMin'] as int? ?? 0;
    final creator = session['creator'] as Map<String, dynamic>?;
    final displayName = creator?['creatorProfile']?['displayName'] as String? ?? creator?['username'] as String? ?? '';
    final coachUsername = creator?['username'] as String? ?? '';
    final isLive = status == 'LIVE';
    final fmt = scheduledAt != null ? DateFormat('d MMMM yyyy, HH:mm', 'tr').format(scheduledAt) : '';

    return GestureDetector(
      onTap: () => context.push('/coach/$coachUsername'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: MettloColors.surface1,
          borderRadius: BorderRadius.circular(MettloRadius.card),
          border: Border.all(color: isLive ? MettloColors.error.withValues(alpha: .5) : MettloColors.borderSubtle),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isLive ? MettloColors.error.withValues(alpha: .15) : MettloColors.primary.withValues(alpha: .12),
                borderRadius: BorderRadius.circular(MettloRadius.pill),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                if (isLive) Container(width: 6, height: 6, decoration: const BoxDecoration(color: MettloColors.error, shape: BoxShape.circle), margin: const EdgeInsets.only(right: 5)),
                Text(isLive ? 'Canlı' : 'Planlandı', style: TextStyle(color: isLive ? MettloColors.error : MettloColors.primary, fontSize: 11, fontWeight: FontWeight.w700)),
              ]),
            ),
            const Spacer(),
            if (durationMin > 0) Text('$durationMin dk', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12)),
          ]),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, height: 1.3)),
          const SizedBox(height: 6),
          Row(children: [
            const Icon(Icons.person_outline, size: 14, color: MettloColors.textTertiary),
            const SizedBox(width: 4),
            Text(displayName, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5)),
          ]),
          if (fmt.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.calendar_today_outlined, size: 13, color: MettloColors.textTertiary),
              const SizedBox(width: 4),
              Text(fmt, style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
            ]),
          ],
        ]),
      ),
    );
  }
}
