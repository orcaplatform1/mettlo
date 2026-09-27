import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/report_dialog.dart';
import '../social/follow_button.dart';
import '../social/stories_bar.dart';

final _memberProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, username) async =>
    await ref.watch(apiClientProvider).get('/public/profiles/${Uri.encodeComponent(username.toLowerCase())}', auth: false) as Map<String, dynamic>);

class MemberProfilePage extends ConsumerWidget {
  const MemberProfilePage({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(_memberProfileProvider(username));
    final me = ref.watch(authControllerProvider).user;
    final isOwn = me?.username == username;

    return Scaffold(
      appBar: AppBar(title: Text('@$username'), actions: [
        if (!isOwn && me != null)
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (v) {
              if (v == 'report') showDialog(context: context, builder: (_) => ReportDialog(targetType: 'user', targetId: username));
            },
            itemBuilder: (_) => [const PopupMenuItem(value: 'report', child: Row(children: [Icon(Icons.flag_outlined, size: 18, color: Colors.red), SizedBox(width: 8), Text('Şikayet Et')]))],
          ),
      ]),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) {
          if (e is ApiException && e.status == 404) return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu kullanıcı bulunamadı.'));
          return Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Bir hata oluştu.', error: true));
        },
        data: (p) {
          // Koç ise coach_profile_page'e yönlendir — bu sayfa sadece member/subscriber
          final type = p['type'] as String? ?? 'member';
          if (type == 'coach') return _CoachRedirect(username: username);
          return _MemberBody(p: p, username: username, isOwn: isOwn, me: me);
        },
      ),
    );
  }
}

class _CoachRedirect extends StatelessWidget {
  const _CoachRedirect({required this.username});
  final String username;
  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.mounted) context.pushReplacement('/coach/$username');
    });
    return const Center(child: CircularProgressIndicator(color: MettloColors.primary));
  }
}

class _MemberBody extends ConsumerWidget {
  const _MemberBody({required this.p, required this.username, required this.isOwn, required this.me});
  final Map<String, dynamic> p;
  final String username;
  final bool isOwn;
  final dynamic me;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coverUrl = imgUrlOrNull(p['coverUrl'] as String?);
    final avatarUrl = imgUrlOrNull(p['avatarUrl'] as String?);
    final name = p['name'] as String? ?? username;
    final memberSince = p['memberSince'] as String?;
    final streak = p['streak'] as Map<String, dynamic>?;
    final subscribedTo = (p['subscribedTo'] as List?) ?? [];

    final followData = me != null && !isOwn ? ref.watch(followDataProvider(username)) : null;

    return ListView(padding: EdgeInsets.zero, children: [
      // ── HERO ──
      Stack(clipBehavior: Clip.none, children: [
        // Kapak
        SizedBox(
          height: 180,
          width: double.infinity,
          child: coverUrl != null
              ? Image.network(coverUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _gradientBox())
              : _gradientBox(),
        ),
        // Avatar overlaid
        Positioned(
          left: 20,
          bottom: -44,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: MettloColors.bg, width: 4),
            ),
            child: CircleAvatar(
              radius: 44,
              backgroundColor: MettloColors.primary,
              backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
              child: avatarUrl == null ? Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 28)) : null,
            ),
          ),
        ),
        // Aksiyonlar sağda
        if (!isOwn && me != null)
          Positioned(
            right: 16,
            bottom: 12,
            child: Row(children: [
              FollowButton(username: username),
            ]),
          ),
      ]),

      // ── İsim + bilgiler ──
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 58, 20, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
          const SizedBox(height: 2),
          Text('@$username', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 14)),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 6, children: [
            if (memberSince != null)
              _Pill('Üyelik: ${_fmtDate(memberSince)}'),
            if (streak != null && (streak['current'] as int? ?? 0) > 0)
              _Pill('🔥 ${streak['current']} gün seri', gold: true),
          ]),
          const SizedBox(height: 16),

          // FollowStats
          if (followData != null)
            followData.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (d) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                FollowStats(
                  username: username,
                  followersCount: (d['followers'] as int?) ?? 0,
                  followingCount: (d['following'] as int?) ?? 0,
                ),
                const SizedBox(height: 6),
                MutualFollowBadge(username: username),
              ]),
            ),

          // Hikayeler
          ProfileStoriesSection(username: username, isOwn: isOwn),

          // Abone olunan koçlar
          if (subscribedTo.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Abone Olunan Koçlar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final c in subscribedTo)
                GestureDetector(
                  onTap: () => context.push('/coach/${c['username']}'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(20), border: Border.all(color: MettloColors.borderSubtle)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundImage: c['avatarUrl'] != null ? NetworkImage(imgUrl(c['avatarUrl'] as String)) : null,
                        backgroundColor: MettloColors.primary,
                        child: c['avatarUrl'] == null ? Text((c['displayName'] as String? ?? '?')[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)) : null,
                      ),
                      const SizedBox(width: 8),
                      Text(c['displayName'] as String? ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),
            ]),
          ],

          const SizedBox(height: 80),
        ]),
      ),
    ]);
  }

  Widget _gradientBox() => Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFf97316), Color(0xFFef4444), Color(0xFF818cf8)],
      ),
    ),
  );

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      const months = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return '${months[d.month]} ${d.year}';
    } catch (_) { return iso; }
  }
}

class _Pill extends StatelessWidget {
  const _Pill(this.label, {this.gold = false});
  final String label;
  final bool gold;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: gold ? const Color(0x1FF59E0B) : MettloColors.surface2,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: gold ? const Color(0x40F59E0B) : MettloColors.borderSubtle),
    ),
    child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: gold ? const Color(0xFFF59E0B) : MettloColors.textSecondary)),
  );
}
