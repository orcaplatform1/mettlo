import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/report_dialog.dart';
import '../admin/profile_admin_panel.dart';
import '../social/follow_button.dart';
import '../social/stories_bar.dart';

final _memberProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>(
  (ref, username) async =>
      await ref.watch(apiClientProvider).get('/public/profiles/${Uri.encodeComponent(username.toLowerCase())}', auth: false) as Map<String, dynamic>,
);

class MemberProfilePage extends ConsumerWidget {
  const MemberProfilePage({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(_memberProfileProvider(username));
    final me = ref.watch(authControllerProvider).user;
    final isOwn = me?.username == username;

    return Scaffold(
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) {
          if (e is ApiException && e.status == 404) {
            return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu kullanıcı bulunamadı.'));
          }
          return Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Bir hata oluştu.', error: true));
        },
        data: (p) {
          final type = p['type'] as String? ?? 'member';
          if (type == 'coach') return _CoachRedirect(username: username);
          if (type == 'staff') return _StaffBody(p: p, username: username, isOwn: isOwn);
          return _MemberBody(p: p, username: username, isOwn: isOwn, me: me);
        },
      ),
    );
  }
}

// ── Redirect to coach page ──

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

// ── Staff Profile Body ──

class _StaffBody extends StatelessWidget {
  const _StaffBody({required this.p, required this.username, required this.isOwn});
  final Map<String, dynamic> p;
  final String username;
  final bool isOwn;

  static const _kRoleLabel = {
    'founder': 'Kurucu',
    'admin': 'Yönetici',
    'moderator': 'Topluluk Kontrolörü',
    'support': 'Müşteri İlişkileri',
  };
  static const _kRoleColor = {
    'founder': Color(0xFFef4444),
    'admin': Color(0xFF22c55e),
    'moderator': Color(0xFFf97316),
    'support': Color(0xFFa855f7),
  };
  static const _kRoleTagline = {
    'founder': "Mettlo'nun kurucusu ve ürün mimarı",
    'admin': 'Mettlo yönetici ekibi',
    'moderator': 'Topluluk moderasyon ve yönetimi',
    'support': 'Müşteri ilişkileri ve destek ekibi',
  };

  @override
  Widget build(BuildContext context) {
    final staffRole = p['staffRole'] as String? ?? '';
    final roleLabel = _kRoleLabel[staffRole] ?? 'Mettlo Ekibi';
    final roleColor = _kRoleColor[staffRole] ?? const Color(0xFF6b7280);
    final roleTagline = _kRoleTagline[staffRole] ?? 'Mettlo ekip üyesi';
    final avatarUrl = imgUrlOrNull(p['avatarUrl'] as String?);
    final name = p['name'] as String? ?? username;
    final staffHeadline = p['staffHeadline'] as String?;
    final staffBio = p['staffBio'] as String?;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Column(children: [
            // ── Kapak (staff özel gradient) ──
            Stack(children: [
              Container(
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [roleColor.withValues(alpha: .6), const Color(0xFF0F1628), roleColor.withValues(alpha: .2)],
                  ),
                ),
              ),
              // Geri butonu
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 8,
                child: Material(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => context.pop(),
                    child: const Padding(padding: EdgeInsets.all(8), child: Icon(Icons.arrow_back, color: Colors.white, size: 20)),
                  ),
                ),
              ),
              // Avatar
              Positioned(
                left: 16,
                bottom: -44,
                child: Container(
                  decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: MettloColors.bg, width: 4)),
                  child: CircleAvatar(
                    radius: 44,
                    backgroundColor: roleColor,
                    backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                    child: avatarUrl == null ? Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 28)) : null,
                  ),
                ),
              ),
            ]),

            // ── Bilgiler ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 52, 16, 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // İsim + rol rozeti
                Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                  Expanded(child: Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: roleColor.withValues(alpha: .12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: roleColor.withValues(alpha: .4)),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.shield_outlined, size: 12, color: roleColor),
                      const SizedBox(width: 5),
                      Text(roleLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: roleColor)),
                    ]),
                  ),
                ]),
                const SizedBox(height: 3),
                Text('@$username', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 14)),
                const SizedBox(height: 4),
                Text(staffHeadline ?? roleTagline, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 14)),
                const SizedBox(height: 12),
                // Takipçi istatistikleri
                FollowStats(username: username, followersCount: 0, followingCount: 0),
                // Hikayeler
                ProfileStoriesSection(username: username, isOwn: isOwn),
              ]),
            ),

            // ── Hakkında ──
            if (staffBio != null && staffBio.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [const Color(0xFF111827), roleColor.withValues(alpha: .08)]),
                    borderRadius: BorderRadius.circular(MettloRadius.lg),
                    border: Border.all(color: MettloColors.borderHover),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Hakkında', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 8),
                    Text(staffBio, style: const TextStyle(color: MettloColors.textSecondary, height: 1.7)),
                  ]),
                ),
              ),
          ]),
        ),
        // Süper admin paneli
        SliverToBoxAdapter(child: ProfileAdminPanel(username: username)),
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }
}

// ── Member Profile Body ──

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

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Column(children: [
            // ── Hero (kapak + avatar) ──
            Stack(clipBehavior: Clip.none, children: [
              SizedBox(
                height: 200,
                width: double.infinity,
                child: coverUrl != null
                    ? CachedNetworkImage(imageUrl: coverUrl, fit: BoxFit.cover, errorWidget: (_, __, ___) => _gradientBox())
                    : _gradientBox(),
              ),
              // Geri butonu
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 8,
                child: Material(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => context.pop(),
                    child: const Padding(padding: EdgeInsets.all(8), child: Icon(Icons.arrow_back, color: Colors.white, size: 20)),
                  ),
                ),
              ),
              // Avatar
              Positioned(
                left: 16,
                bottom: -44,
                child: Container(
                  decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: MettloColors.bg, width: 4)),
                  child: CircleAvatar(
                    radius: 44,
                    backgroundColor: MettloColors.primary,
                    backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                    child: avatarUrl == null ? Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 28)) : null,
                  ),
                ),
              ),
              // Aksiyonlar
              Positioned(
                right: 12,
                bottom: 8,
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  if (isOwn)
                    GestureDetector(
                      onTap: () => launchUrl(Uri.parse('${Env.siteUrl}/app/settings'), mode: LaunchMode.externalApplication),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white24)),
                        child: const Text('Profili Düzenle', style: TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                      ),
                    )
                  else if (me != null) ...[
                    const SizedBox(width: 6),
                    FollowButton(username: username),
                  ],
                ]),
              ),
            ]),

            // ── İsim + bilgiler ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 52, 16, 0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                const SizedBox(height: 2),
                Text('@$username', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 14)),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 6, children: [
                  if (memberSince != null) _Pill('Üyelik: ${_fmtDate(memberSince)}'),
                  if (streak != null && (streak['current'] as int? ?? 0) > 0)
                    _Pill('🔥 ${streak['current']} gün seri', gold: true),
                ]),
                const SizedBox(height: 14),

                // Takipçi istatistikleri
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
                  const SizedBox(height: 20),
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

                // Şikayet + Engelle (başkasının profili)
                if (!isOwn && me != null) ...[
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                        onPressed: () => showDialog(context: context, builder: (_) => ReportDialog(targetType: 'user', targetId: username)),
                        icon: const Icon(Icons.flag_outlined, size: 15),
                        label: const Text('Şikayet Et', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  ]),
                ],

                const SizedBox(height: 80),
              ]),
            ),
          ]),
        ),
        // Admin paneli
        SliverToBoxAdapter(child: ProfileAdminPanel(username: username)),
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
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

// ── Helpers ──

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
