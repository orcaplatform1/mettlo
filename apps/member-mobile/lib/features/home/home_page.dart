import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final overviewProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/overview') as Map<String, dynamic>);
final gamificationProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/gamification') as Map<String, dynamic>);

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final ov = ref.watch(overviewProvider);
    final gm = ref.watch(gamificationProvider);
    return RefreshIndicator(
      color: MettloColors.primary,
      onRefresh: () async {
        ref.invalidate(overviewProvider);
        ref.invalidate(gamificationProvider);
      },
      child: ListView(padding: const EdgeInsets.all(20), children: [
        Row(children: [
          UserAvatar(name: user?.name ?? '?', url: user?.avatarUrl, size: 44),
          const SizedBox(width: 12),
          Expanded(child: Text('Merhaba ${user?.name.split(' ').first ?? ''} 👋', style: Theme.of(context).textTheme.headlineSmall)),
          IconButton(onPressed: () => context.push('/support'), icon: const Icon(Icons.support_agent_outlined), tooltip: 'Destek Merkezi'),
        ]),
        const SizedBox(height: 4),
        const Text('Bugün kendin için harika bir gün.', style: TextStyle(color: MettloColors.textSecondary)),
        const SizedBox(height: 20),
        AsyncBody(
          value: gm,
          onRetry: () => ref.invalidate(gamificationProvider),
          builder: (g) => GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6, children: [
            StatTile(icon: Icons.bolt, value: '${g['xp']}', label: 'Toplam XP · Seviye ${g['level']}'),
            StatTile(icon: Icons.local_fire_department, value: '${(g['streak'] as Map)['current']}', label: 'Günlük seri (en uzun ${(g['streak'] as Map)['longest']})'),
          ]),
        ),
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
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    ListTile(
                      onTap: () => context.push('/coach/${s['coach']['username']}'),
                      leading: UserAvatar(name: s['coach']['displayName'] ?? s['coach']['username'], url: s['coach']['avatarUrl'], verified: s['coach']['verified'] == true, size: 44),
                      title: Text(s['coach']['displayName'] ?? s['coach']['username'], style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(s['endsAt'] != null ? '${_date(s['endsAt'])} tarihine kadar' : 'Süresiz', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
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
        const SectionTitle('Keşfet'),
        Wrap(spacing: 10, runSpacing: 10, children: [
          _Quick(Icons.event_outlined, 'Etkinlikler', () => context.push('/events')),
          _Quick(Icons.work_outline, 'İş İlanları', () => context.push('/jobs')),
          _Quick(Icons.store_outlined, 'İşletmeler', () => context.push('/business')),
          _Quick(Icons.psychology_outlined, 'AI Eşleştirme', () => context.push('/ai/matching')),
        ]),
        const SectionTitle('Hızlı erişim'),
        Wrap(spacing: 10, runSpacing: 10, children: [
          _Quick(Icons.monitor_heart_outlined, 'Sağlık & İlerleme', () => context.push('/health')),
          _Quick(Icons.notifications_outlined, 'Bildirimler', () => context.push('/notifications')),
          _Quick(Icons.support_agent_outlined, 'Destek Merkezi', () => context.push('/support')),
        ]),
      ]),
    );
  }
}

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
  bool _confirm = false;
  bool _loading = false;

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
  Widget build(BuildContext context) => ActionChip(avatar: Icon(icon, size: 18, color: MettloColors.primary), label: Text(label), onPressed: onTap, backgroundColor: MettloColors.surface1, side: const BorderSide(color: MettloColors.borderSubtle));
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
