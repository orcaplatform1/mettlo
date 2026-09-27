import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';
import '../social/stories_bar.dart';

// ── Providers ──

final overviewProvider = FutureProvider.autoDispose<Map<String, dynamic>>(
  (ref) async => await ref.watch(apiClientProvider).get('/me/overview') as Map<String, dynamic>,
);
final gamificationProvider = FutureProvider.autoDispose<Map<String, dynamic>>(
  (ref) async => await ref.watch(apiClientProvider).get('/me/gamification') as Map<String, dynamic>,
);
final videoSessionsProvider = FutureProvider.autoDispose<Map<String, dynamic>?>(
  (ref) async {
    try {
      return await ref.watch(apiClientProvider).get('/me/video-sessions') as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  },
);

// ── Hero ──

class _HomeHero extends ConsumerWidget {
  const _HomeHero();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      decoration: const BoxDecoration(gradient: MettloColors.heroGradient),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          UserAvatar(name: user?.name ?? '?', url: user?.avatarUrl, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Merhaba, ${user?.name.split(' ').first ?? ''} 👋', style: const TextStyle(fontSize: 15, color: MettloColors.textSecondary)),
              ShaderMask(
                shaderCallback: (b) => MettloColors.gradientSunrise.createShader(b),
                child: const Text('METTLO', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: 3, color: Colors.white)),
              ),
            ]),
          ),
          IconButton(onPressed: () => context.push('/support'), icon: const Icon(Icons.support_agent_outlined, color: MettloColors.textSecondary), tooltip: 'Destek Merkezi'),
        ]),
        const SizedBox(height: 6),
        const Text('Bugün kendin için harika bir gün.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 14, height: 1.5)),
        const SizedBox(height: 14),
        const StoriesBar(),
      ]),
    );
  }
}

// ── Main Page ──

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ov = ref.watch(overviewProvider);
    final gm = ref.watch(gamificationProvider);
    final vs = ref.watch(videoSessionsProvider);
    final user = ref.watch(authControllerProvider).user;
    final role = user?.role ?? '';

    return RefreshIndicator(
      color: MettloColors.primary,
      onRefresh: () async {
        ref.invalidate(overviewProvider);
        ref.invalidate(gamificationProvider);
        ref.invalidate(videoSessionsProvider);
      },
      child: ListView(padding: EdgeInsets.zero, children: [
        const _HomeHero(),

        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

            // Koç başvurusu bekliyor uyarısı
            if (role == 'CREATOR')
              ov.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (o) => (o['creator']?['status'] == 'PENDING')
                    ? const Padding(
                        padding: EdgeInsets.only(bottom: 14),
                        child: InfoBanner('Koç başvurun inceleniyor. Onaylandığında bilgilendirileceksin.'),
                      )
                    : const SizedBox.shrink(),
              ),

            // Gamification + hızlı stat grid
            AsyncBody(
              value: gm,
              onRetry: () => ref.invalidate(gamificationProvider),
              builder: (g) => GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.6,
                children: [
                  StatTile(icon: Icons.bolt, value: '${g['xp']}', label: 'Toplam XP · Seviye ${g['level']}'),
                  StatTile(icon: Icons.local_fire_department, value: '${(g['streak'] as Map)['current']}', label: 'Günlük seri (en uzun ${(g['streak'] as Map)['longest']})'),
                  GestureDetector(onTap: () => context.push('/programs'), child: StatTile(icon: Icons.assignment_outlined, value: '${(ov.asData?.value ?? const {})['subscriptions']?.length ?? 0}', label: 'Aktif abonelik · Programlarım')),
                  GestureDetector(onTap: () => context.push('/health'), child: const StatTile(icon: Icons.favorite_outline, value: '❤', label: 'Sağlık & İlerleme')),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Mesajlar / Bildirimler / Destek kartları
            AsyncBody(
              value: ov,
              onRetry: () => ref.invalidate(overviewProvider),
              builder: (o) => GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.0,
                children: [
                  _QuickCard(
                    icon: Icons.chat_bubble_outline,
                    label: 'Mesajlar',
                    onTap: () => context.push('/messages'),
                  ),
                  _QuickCard(
                    icon: Icons.notifications_outlined,
                    value: '${o['unreadNotifications'] ?? 0}',
                    label: 'Bildirim',
                    highlight: (o['unreadNotifications'] as int? ?? 0) > 0,
                    onTap: () => context.push('/notifications'),
                  ),
                  _QuickCard(
                    icon: Icons.support_agent_outlined,
                    value: '${o['openTickets'] ?? 0}',
                    label: 'Destek',
                    highlight: (o['openTickets'] as int? ?? 0) > 0,
                    onTap: () => context.push('/support'),
                  ),
                ],
              ),
            ),

            // ── Aboneliklerim ──
            const SectionTitle('Aboneliklerim'),
            AsyncBody(
              value: ov,
              onRetry: () => ref.invalidate(overviewProvider),
              builder: (o) {
                final subs = (o['subscriptions'] as List).where((s) => s['coach'] != null).toList();
                if (subs.isEmpty) {
                  return Column(children: [
                    const InfoBanner('Henüz bir koça abone değilsin. Abone olduğunda koçun tüm içeriklerine, programlarına ve canlı derslerine erişirsin.'),
                    const SizedBox(height: 12),
                    MettloButton(label: 'Koçları Keşfet', onPressed: () => context.go('/discover')),
                  ]);
                }
                return Column(children: [
                  for (final s in subs)
                    Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        ListTile(
                          onTap: () => context.push('/coach/${s['coach']['username']}'),
                          leading: UserAvatar(name: s['coach']['displayName'] ?? s['coach']['username'], url: s['coach']['avatarUrl'], verified: s['coach']['verified'] == true, size: 44),
                          title: Text(s['coach']['displayName'] ?? s['coach']['username'], style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            s['source'] == 'CREATOR_INVITE_GRANT'
                                ? 'Koç daveti · ${s['endsAt'] != null ? '${_date(s['endsAt'])} tarihine kadar' : 'Süresiz'}'
                                : s['endsAt'] != null ? '${_date(s['endsAt'])} tarihine kadar' : 'Süresiz',
                            style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5),
                          ),
                          trailing: const Icon(Icons.chevron_right),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(left: 12, right: 12, bottom: 10),
                          child: _CancelSubBtn(coachUsername: s['coach']['username'] as String, onCancelled: () => ref.invalidate(overviewProvider)),
                        ),
                      ]),
                    ),
                ]);
              },
            ),

            // ── Abonelerim (sadece CREATOR) ──
            if (role == 'CREATOR') ...[
              const SectionTitle('Abonelerim'),
              Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                OutlinedButton(
                  onPressed: () => context.push('/subscribers'),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
                  child: const Text('Tümünü Yönet', style: TextStyle(fontSize: 13)),
                ),
              ]),
              const SizedBox(height: 8),
            ],

            // ── 1:1 Görüntülü Koçluk ──
            vs.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (v) {
                if (v == null) return const SizedBox.shrink();
                final total = (v['totalRemaining'] as int? ?? 0);
                final balances = (v['balances'] as List?) ?? [];
                final active = balances.where((b) => (b['remaining'] as int? ?? 0) > 0).toList();
                if (total == 0 && active.isEmpty) return const SizedBox.shrink();
                return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const SectionTitle('1:1 Görüntülü Koçluk'),
                  Row(children: [
                    const Icon(Icons.videocam_outlined, size: 18, color: MettloColors.primary),
                    const SizedBox(width: 8),
                    Text('$total oturum hakkı', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  ]),
                  const SizedBox(height: 8),
                  for (final b in active)
                    Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text((b['pack']?['name'] as String?) ?? '', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                          ShaderMask(
                            shaderCallback: (bounds) => MettloColors.gradientSunrise.createShader(bounds),
                            child: Text('${b['remaining']} oturum kaldı', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                          ),
                          const SizedBox(height: 2),
                          Text('Son kullanma: ${_date(b['expiresAt'])}', style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary)),
                        ]),
                      ),
                    ),
                  GestureDetector(
                    onTap: () => context.push('/video-sessions'),
                    child: const Text('Oturumlarımı Gör →', style: TextStyle(color: MettloColors.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(height: 4),
                ]);
              },
            ),

            // ── Günlüklerim ──
            const SectionTitle('Günlüklerim'),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _SportChip(label: 'Koşu', icon: Icons.directions_run, path: '/sports/running'),
              _SportChip(label: 'Boks', icon: Icons.sports_mma, path: '/sports/boxing'),
              _SportChip(label: 'Yoga', icon: Icons.self_improvement, path: '/sports/yoga'),
              _SportChip(label: 'Meditasyon', icon: Icons.spa_outlined, path: '/sports/meditation'),
              _SportChip(label: 'HIIT', icon: Icons.fitness_center, path: '/sports/hiit'),
              _SportChip(label: 'Dans', icon: Icons.music_note_outlined, path: '/sports/dance'),
              _SportChip(label: 'Beslenme', icon: Icons.restaurant_menu, path: '/sports/nutrition'),
              _SportChip(label: 'Pilates', icon: Icons.accessibility_new, path: '/sports/pilates'),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: OutlinedButton.icon(onPressed: () => context.push('/bookings'), icon: const Icon(Icons.event_available_outlined, size: 16), label: const Text('Rezervasyonlar'))),
              const SizedBox(width: 8),
              Expanded(child: OutlinedButton.icon(onPressed: () => context.push('/challenges'), icon: const Icon(Icons.emoji_events_outlined, size: 16), label: const Text("Challenge'lar"))),
            ]),

            // ── Keşfet ──
            const SectionTitle('Keşfet'),
            Wrap(spacing: 10, runSpacing: 10, children: [
              _Quick(Icons.event_outlined, 'Etkinlikler', () => context.push('/events')),
              _Quick(Icons.sensors, 'Canlı Dersler', () => context.push('/live')),
              _Quick(Icons.people_outline, 'Topluluk', () => context.push('/community')),
              _Quick(Icons.emoji_events_outlined, "Challenge'lar", () => context.push('/challenges')),
              _Quick(Icons.work_outline, 'İş İlanları', () => context.push('/jobs')),
              _Quick(Icons.storefront_outlined, 'İşletmeler', () => context.push('/business')),
              _Quick(Icons.restaurant_menu_outlined, 'Restoranlar', () => context.push('/restaurants')),
              _Quick(Icons.psychology_outlined, 'AI Eşleştirme', () => context.push('/ai/matching')),
            ]),

            // ── Hızlı erişim ──
            const SectionTitle('Hızlı Erişim'),
            Wrap(spacing: 10, runSpacing: 10, children: [
              _Quick(Icons.confirmation_number_outlined, 'Etkinliklerim', () => context.push('/my-events')),
              _Quick(Icons.monitor_heart_outlined, 'Sağlık & İlerleme', () => context.push('/health')),
              _Quick(Icons.notifications_outlined, 'Bildirimler', () => context.push('/notifications')),
              _Quick(Icons.support_agent_outlined, 'Destek Merkezi', () => context.push('/support')),
            ]),
          ]),
        ),
      ]),
    );
  }
}

// ── Quick Card (messages/notifications/tickets) ──

class _QuickCard extends StatelessWidget {
  const _QuickCard({required this.icon, this.value, required this.label, this.highlight = false, required this.onTap});
  final IconData icon;
  final String? value;
  final String label;
  final bool highlight;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: MettloColors.surface1,
        borderRadius: BorderRadius.circular(MettloRadius.lg),
        border: Border.all(color: highlight ? MettloColors.primary.withValues(alpha: .4) : MettloColors.borderSubtle),
      ),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 22, color: highlight ? MettloColors.primary : MettloColors.textSecondary),
        if (value != null) ...[
          const SizedBox(height: 4),
          Text(
            value!,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: highlight ? MettloColors.primary : MettloColors.textPrimary,
            ),
          ),
        ],
        const SizedBox(height: 3),
        Text(label, style: const TextStyle(fontSize: 11, color: MettloColors.textTertiary), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
      ]),
    ),
  );
}

// ── Helpers ──

String _date(dynamic iso) {
  final d = DateTime.tryParse('$iso')?.toLocal();
  return d == null ? '' : '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
}

class _CancelSubBtn extends ConsumerStatefulWidget {
  const _CancelSubBtn({required this.coachUsername, required this.onCancelled});
  final String coachUsername;
  final VoidCallback onCancelled;
  @override
  ConsumerState<_CancelSubBtn> createState() => _CancelSubBtnState();
}

class _CancelSubBtnState extends ConsumerState<_CancelSubBtn> {
  bool _confirm = false, _loading = false;

  Future<void> _cancel() async {
    setState(() => _loading = true);
    try {
      await ref.read(apiClientProvider).post('/me/subscriptions/cancel-by-creator/${widget.coachUsername}');
      widget.onCancelled();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() { _loading = false; _confirm = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_confirm) {
      return TextButton.icon(
        onPressed: () => setState(() => _confirm = true),
        icon: const Icon(Icons.cancel_outlined, size: 16, color: MettloColors.error),
        label: const Text('Aboneliği İptal Et', style: TextStyle(color: MettloColors.error, fontSize: 13)),
        style: TextButton.styleFrom(padding: EdgeInsets.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
      );
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Emin misin? İptal sonrasında bu koçun içeriklerine erişimin sona erecektir.', style: TextStyle(fontSize: 12.5, color: MettloColors.textSecondary)),
      const SizedBox(height: 8),
      Row(children: [
        FilledButton(
          onPressed: _loading ? null : _cancel,
          style: FilledButton.styleFrom(backgroundColor: MettloColors.error, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
          child: _loading ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Evet, iptal et', style: TextStyle(fontSize: 12.5)),
        ),
        const SizedBox(width: 8),
        OutlinedButton(
          onPressed: _loading ? null : () => setState(() => _confirm = false),
          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
          child: const Text('Vazgeç', style: TextStyle(fontSize: 12.5)),
        ),
      ]),
    ]);
  }
}

class _Quick extends StatelessWidget {
  const _Quick(this.icon, this.label, this.onTap);
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ActionChip(
    avatar: Icon(icon, size: 18, color: MettloColors.primary),
    label: Text(label),
    onPressed: onTap,
    backgroundColor: MettloColors.surface1,
    side: const BorderSide(color: MettloColors.borderSubtle),
  );
}

class _SportChip extends StatelessWidget {
  const _SportChip({required this.label, required this.icon, required this.path});
  final String label;
  final IconData icon;
  final String path;
  @override
  Widget build(BuildContext context) => ActionChip(
    avatar: Icon(icon, size: 15, color: MettloColors.primary),
    label: Text(label, style: const TextStyle(fontSize: 12)),
    onPressed: () => context.push(path),
    backgroundColor: MettloColors.surface1,
    side: const BorderSide(color: MettloColors.borderSubtle),
  );
}
