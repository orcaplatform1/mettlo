import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/validation/validators.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/report_dialog.dart';
import '../admin/profile_admin_panel.dart';
import '../home/home_page.dart';
import '../social/follow_button.dart';
import '../social/stories_bar.dart';

final coachProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>(
  (ref, u) async => await ref.watch(apiClientProvider).get('/public/profiles/$u', auth: false) as Map<String, dynamic>,
);
final coachClassesProvider = FutureProvider.autoDispose.family<List<dynamic>, String>(
  (ref, u) async => await ref.watch(apiClientProvider).get('/public/creators/$u/classes', auth: false) as List<dynamic>,
);
final reviewEligibilityProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>(
  (ref, u) async => await ref.watch(apiClientProvider).get('/reviews/creators/$u/eligibility') as Map<String, dynamic>,
);

const _kStaffRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'];

String _tenure(int months) {
  if (months < 1) return '1 aydan az';
  final y = months ~/ 12, m = months % 12;
  return [if (y > 0) '$y yıl', if (m > 0) '$m ay'].join(' ');
}

void _showReplyBox(BuildContext context, WidgetRef ref, String reviewId, String coachUsername) {
  final ctrl = TextEditingController();
  bool busy = false;
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.viewInsetsOf(ctx).bottom + 16),
      child: StatefulBuilder(
        builder: (_, setS) => Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Yorumu Yanıtla', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 12),
          TextField(controller: ctrl, maxLines: 3, maxLength: 1000, decoration: const InputDecoration(hintText: 'Yanıtınızı yazın...')),
          const SizedBox(height: 10),
          Row(mainAxisAlignment: MainAxisAlignment.end, children: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
            FilledButton(
              onPressed: busy ? null : () async {
                final text = ctrl.text.trim();
                if (text.isEmpty) return;
                setS(() => busy = true);
                try {
                  await ref.read(apiClientProvider).post('/reviews/$reviewId/reply', body: {'body': text});
                  ref.invalidate(coachProfileProvider(coachUsername));
                  if (ctx.mounted) Navigator.pop(ctx);
                } on ApiException catch (e) {
                  if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.message)));
                  setS(() => busy = false);
                }
              },
              child: busy ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Gönder'),
            ),
          ]),
        ]),
      ),
    ),
  );
}

class CoachProfilePage extends ConsumerWidget {
  const CoachProfilePage({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(coachProfileProvider(username));
    final user = ref.watch(authControllerProvider).user;
    final isOwn = user?.username == username;
    final isStaff = _kStaffRoles.contains(user?.role);

    return Scaffold(
      body: profile.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) {
          if (e is ApiException && e.status == 404) {
            return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu kullanıcı bulunamamaktadır.'));
          }
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              InfoBanner(e is ApiException ? e.message : 'Bir hata oluştu.', error: true),
              const SizedBox(height: 12),
              MettloButton(label: 'Tekrar Dene', secondary: true, onPressed: () => ref.invalidate(coachProfileProvider(username))),
            ]),
          );
        },
        data: (p) {
          if (p['type'] != 'coach') return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu bir koç profili değil.'));
          return _Body(p: p, username: username, isOwnProfile: isOwn, isStaff: isStaff);
        },
      ),
    );
  }
}

// ── Hero section ──

class _CoachHero extends ConsumerWidget {
  const _CoachHero({
    required this.p,
    required this.username,
    required this.isOwnProfile,
    required this.isStaff,
    required this.isSubscriber,
    required this.plans,
  });
  final Map<String, dynamic> p;
  final String username;
  final bool isOwnProfile, isStaff, isSubscriber;
  final List plans;

  String _subscribeUrl(String? planId) => planId != null ? '${Env.siteUrl}/checkout/$planId' : '${Env.siteUrl}/profile/$username#plans';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coverUrl = imgUrlOrNull(p['coverUrl'] as String?);
    final avatarUrl = imgUrlOrNull(p['avatarUrl'] as String?);
    final displayName = p['displayName'] as String;
    final verified = p['verified'] == true;
    final headline = p['headline'] as String?;
    final st = p['stats'] as Map<String, dynamic>;
    final tenure = st['tenureBadge'] as Map<String, dynamic>?;
    final user = ref.watch(authControllerProvider).user;
    final canMsg = user != null;
    final firstPlanId = plans.isNotEmpty ? plans.first['id'] as String? : null;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // ── Kapak fotoğrafı ──
      Stack(clipBehavior: Clip.none, children: [
        SizedBox(
          height: 220,
          width: double.infinity,
          child: coverUrl != null
              ? CachedNetworkImage(
                  imageUrl: coverUrl,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => _gradient(),
                )
              : _gradient(),
        ),
        // Geri butonu
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 8,
          child: Material(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(20),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () => context.pop(),
              child: const Padding(padding: EdgeInsets.all(8), child: Icon(Icons.arrow_back, color: Colors.white, size: 20)),
            ),
          ),
        ),
        // Kapağı düzenle (kendi profili)
        if (isOwnProfile)
          Positioned(
            bottom: 8,
            right: 10,
            child: GestureDetector(
              onTap: () => launchUrl(Uri.parse('${Env.siteUrl}/creator/profile'), mode: LaunchMode.externalApplication),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white24)),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.camera_alt_outlined, size: 13, color: Colors.white),
                  SizedBox(width: 5),
                  Text('Kapağı Düzenle', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w600)),
                ]),
              ),
            ),
          ),
        // Avatar (kapağın üzerine taşıyor)
        Positioned(
          left: 16,
          bottom: -44,
          child: Container(
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: MettloColors.bg, width: 4)),
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: MettloColors.primary,
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null ? Text(displayName[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 28)) : null,
                ),
                if (verified)
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: Container(
                      padding: const EdgeInsets.all(1),
                      decoration: BoxDecoration(color: MettloColors.bg, shape: BoxShape.circle),
                      child: const Icon(Icons.verified, size: 18, color: MettloColors.verified),
                    ),
                  ),
              ],
            ),
          ),
        ),
        // Aksiyon butonları
        Positioned(
          right: 12,
          bottom: 8,
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (!isOwnProfile && canMsg)
              _ActionBtn(icon: Icons.chat_bubble_outline, onTap: () async {
                try {
                  final r = await ref.read(apiClientProvider).post('/messages/conversations', body: {'toUsername': username}) as Map<String, dynamic>;
                  if (context.mounted) context.push('/messages/${r['id']}');
                } on ApiException catch (e) {
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                }
              }),
            if (!isOwnProfile && user != null) ...[
              const SizedBox(width: 6),
              FollowButton(username: username),
            ],
          ]),
        ),
      ]),

      // ── Profil bilgileri ──
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 52, 16, 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // İsim + Abone Ol / Düzenle butonu
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                  Flexible(child: Text(displayName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3))),
                  if (verified) const Padding(padding: EdgeInsets.only(left: 6), child: Icon(Icons.verified, size: 20, color: MettloColors.verified)),
                ]),
                const SizedBox(height: 2),
                Text('@$username', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 14)),
                if (headline != null && headline.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(headline, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 14)),
                ],
              ]),
            ),
            const SizedBox(width: 12),
            if (isOwnProfile)
              OutlinedButton(
                onPressed: () => launchUrl(Uri.parse('${Env.siteUrl}/creator/profile'), mode: LaunchMode.externalApplication),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
                child: const Text('Profili Düzenle', style: TextStyle(fontSize: 12)),
              )
            else if (!isStaff)
              ElevatedButton(
                onPressed: () => launchUrl(Uri.parse(_subscribeUrl(firstPlanId)), mode: LaunchMode.externalApplication),
                style: ElevatedButton.styleFrom(
                  backgroundColor: MettloColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                ),
                child: Text(isSubscriber ? 'Abonesin ✓' : 'Abone Ol', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
              ),
          ]),
          const SizedBox(height: 10),
          // Rozetler
          Wrap(spacing: 8, runSpacing: 8, children: [
            if (tenure != null) TenureBadge(tier: tenure['tier'] as String, label: tenure['label'] as String),
            if (st['experienceYears'] != null) Pill('${st['experienceYears']} yıldır eğitmen'),
            Pill('Mettlo\'da ${_tenure((st['monthsOnMettlo'] as num).toInt())}'),
          ]),
          const SizedBox(height: 12),
          // Takipçi istatistikleri
          if (!isStaff) ...[
            FollowStats(
              username: username,
              followersCount: (st['followers'] as num?)?.toInt() ?? 0,
              followingCount: (st['following'] as num?)?.toInt() ?? 0,
            ),
            const SizedBox(height: 6),
            MutualFollowBadge(username: username),
          ],
          // Hikayeler
          ProfileStoriesSection(username: username, isOwn: isOwnProfile),
        ]),
      ),
    ]);
  }

  Widget _gradient() => Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFf97316), Color(0xFFef4444), Color(0xFF818cf8)],
      ),
    ),
  );
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(18), border: Border.all(color: Colors.white24)),
      child: Icon(icon, color: Colors.white, size: 18),
    ),
  );
}

// ── Body ──

class _Body extends ConsumerWidget {
  const _Body({required this.p, required this.username, required this.isOwnProfile, required this.isStaff});
  final Map<String, dynamic> p;
  final String username;
  final bool isOwnProfile, isStaff;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final st = p['stats'] as Map<String, dynamic>;
    final overview = ref.watch(overviewProvider).asData?.value;
    final isSubscriber = (overview?['subscriptions'] as List?)?.any((s) => s['coach']?['username'] == username) ?? false;
    final classes = ref.watch(coachClassesProvider(username)).asData?.value ?? const [];
    final plans = (p['plans'] as List);
    final reviews = (p['reviews'] as List);
    final dist = (st['ratingDistribution'] as Map);
    final total = (st['ratingCount'] as num?) ?? 0;
    final user = ref.watch(authControllerProvider).user;
    final canMessage = user != null;

    String hours(dynamic v) => (v is num && v == v.roundToDouble()) ? '${v.toInt()}' : NumberFormat('0.0', 'tr').format(v);

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: _CoachHero(
            p: p,
            username: username,
            isOwnProfile: isOwnProfile,
            isStaff: isStaff,
            isSubscriber: isSubscriber,
            plans: plans,
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Stat grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.7,
                children: [
                  StatTile(icon: Icons.people_outline, value: '${st['subscribers']}', label: 'Abone'),
                  StatTile(icon: Icons.star_outline, value: total > 0 ? (num.tryParse('${st['ratingAvg']}') ?? 0).toStringAsFixed(1) : '—', label: total > 0 ? '$total değerlendirme' : 'Henüz değerlendirme yok'),
                  StatTile(icon: Icons.sensors, value: '${hours(st['liveHours'])} sa', label: 'Canlı ders (${st['liveSessions']} ders)'),
                  StatTile(icon: Icons.movie_outlined, value: '${st['videoCount']}', label: 'Video'),
                  StatTile(icon: Icons.timer_outlined, value: '${hours(st['videoHours'])} sa', label: 'Toplam video süresi'),
                  StatTile(icon: Icons.library_books_outlined, value: '${st['contentTotal']}', label: 'Eğitim içeriği'),
                  StatTile(icon: Icons.assignment_outlined, value: '${st['programs'] ?? 0}', label: 'Program'),
                  StatTile(icon: Icons.emoji_events_outlined, value: '${st['challenges'] ?? 0}', label: 'Challenge'),
                ],
              ),

              // Sertifikalar
              if ((p['credentials'] as List).isNotEmpty) ...[
                const SizedBox(height: 14),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final c in p['credentials'] as List)
                    Pill('✓ $c', color: MettloColors.success),
                ]),
              ],

              // Hakkında
              if (p['bio'] != null) ...[
                const SectionTitle('Hakkında'),
                Text(p['bio'] as String, style: const TextStyle(color: MettloColors.textSecondary, height: 1.6)),
              ],

              // Neden Beni Seçmelisiniz
              if (p['whyChooseMe'] != null) ...[
                const SectionTitle('Neden Beni Seçmelisiniz?'),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF111827), Color(0xFF3A1828)]),
                    borderRadius: BorderRadius.circular(MettloRadius.lg),
                    border: Border.all(color: MettloColors.borderHover),
                  ),
                  child: Text(p['whyChooseMe'] as String, style: const TextStyle(color: MettloColors.textSecondary, height: 1.6)),
                ),
              ],

              // Çalıştığı işletmeler
              const SectionTitle('Çalıştığı İşletmeler'),
              () {
                final raw = (p['workplaces'] as List?) ?? (p['coachWorkplaces'] as List?) ?? const [];
                if (raw.isNotEmpty) {
                  return SizedBox(
                    height: 140,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        for (final w in raw)
                          _WorkplaceCard(w: Map<String, dynamic>.from(w is Map && w['business'] != null ? w['business'] as Map : w as Map)),
                      ],
                    ),
                  );
                }
                return const Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 8),
                  child: Text('Henüz çalıştığı işletme eklenmemiş.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                );
              }(),

              // Abonelik planları
              if (!isStaff) ...[
                const SectionTitle('Abonelik Planları'),
                if (plans.isNotEmpty)
                  for (final pl in plans)
                    Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(pl['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: pl['description'] != null ? Text(pl['description'] as String) : null,
                        trailing: Text(
                          '₺${(num.tryParse('${pl['priceWeb']}') ?? 0).toStringAsFixed(0)} / ${pl['interval'] == 'ANNUAL' ? 'yıl' : 'ay'}',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: MettloColors.primary),
                        ),
                      ),
                    )
                else
                  const Padding(
                    padding: EdgeInsets.only(top: 4, bottom: 8),
                    child: Text('Henüz plan eklenmemiş.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                  ),
              ],

              // Programlar
              if ((p['programs'] as List?)?.isNotEmpty == true) ...[
                const SectionTitle('Programlar'),
                for (final pr in p['programs'] as List)
                  Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      onTap: () => context.push('/program/${pr['slug']}'),
                      leading: pr['coverUrl'] != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: CachedNetworkImage(imageUrl: imgUrl(pr['coverUrl'] as String), width: 52, height: 52, fit: BoxFit.cover),
                            )
                          : Container(width: 52, height: 52, decoration: BoxDecoration(color: MettloColors.surface2, borderRadius: BorderRadius.circular(6))),
                      title: Text(pr['title'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('${pr['durationDays'] ?? '?'} gün', style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary)),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  ),
              ] else ...[
                const SectionTitle('Programlar'),
                const Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 8),
                  child: Text('Henüz program eklenmemiş.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                ),
              ],

              // Yaklaşan canlı dersler
              if ((p['lives'] as List?)?.isNotEmpty == true) ...[
                const SectionTitle('Yaklaşan Canlı Dersler'),
                for (final l in p['lives'] as List)
                  Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: MettloColors.primary.withValues(alpha: .15), borderRadius: BorderRadius.circular(8)),
                        child: const Text('CANLI', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: MettloColors.primary)),
                      ),
                      title: Text(l['title'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                        _fmtDate(l['scheduledAt'] as String?),
                        style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary),
                      ),
                    ),
                  ),
              ],

              // Ders takvimi
              const SectionTitle('Ders Takvimi'),
              if (classes.isNotEmpty)
                for (final c in classes)
                  _ClassTile(c: c as Map<String, dynamic>, isSubscriber: isSubscriber, username: username)
              else
                const Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 8),
                  child: Text('Henüz ders takvimi eklenmemiş.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                ),

              // Topluluk
              if (p['community'] != null) ...[
                const SectionTitle('Topluluk'),
                Card(
                  child: ListTile(
                    title: Text((p['community'] as Map)['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${(p['community'] as Map)['members'] ?? 0} üye${(p['community'] as Map)['subscribersOnly'] == true ? ' · yalnızca abonelere özel' : ''}', style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary)),
                    trailing: isSubscriber || (p['community'] as Map)['subscribersOnly'] != true
                        ? TextButton(
                            onPressed: () => context.push('/community/${(p['community'] as Map)['slug']}'),
                            child: const Text('Topluluğa Git'),
                          )
                        : null,
                  ),
                ),
              ],

              // Değerlendirmeler
              const SectionTitle('Değerlendirmeler'),
              if (total > 0)
                Column(children: [
                  for (final n in [5, 4, 3, 2, 1])
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: Row(children: [
                        SizedBox(width: 22, child: Text('$n', style: const TextStyle(color: MettloColors.textSecondary))),
                        Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: total == 0 ? 0 : ((dist['$n'] as num?) ?? 0) / total, minHeight: 8, color: MettloColors.primary, backgroundColor: MettloColors.surface2))),
                        SizedBox(width: 30, child: Text('${dist['$n'] ?? 0}', textAlign: TextAlign.right, style: const TextStyle(color: MettloColors.textSecondary))),
                      ]),
                    ),
                ]),
              const SizedBox(height: 8),
              _ReviewBox(username: username),
              for (final r in reviews)
                Card(
                  margin: const EdgeInsets.only(top: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [for (var i = 0; i < (r['rating'] as int); i++) const Icon(Icons.star, size: 15, color: MettloColors.highlight)]),
                      if (r['body'] != null)
                        Padding(padding: const EdgeInsets.only(top: 6), child: Text(r['body'] as String, style: const TextStyle(color: MettloColors.textSecondary))),
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(r['author'] != null ? '@${r['author']['username']}' : 'Silinmiş kullanıcı', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12)),
                      ),
                      if ((r['replies'] as List?)?.isNotEmpty == true) ...[
                        const SizedBox(height: 8),
                        for (final reply in r['replies'] as List)
                          Container(
                            margin: const EdgeInsets.only(left: 12, top: 4),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: MettloColors.surface2, borderRadius: BorderRadius.circular(8), border: const Border(left: BorderSide(color: MettloColors.primary, width: 2))),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(reply['author'] != null ? '@${reply['author']['username']}' : 'Silinmiş', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: MettloColors.textSecondary)),
                              const SizedBox(height: 2),
                              Text(reply['body'] as String? ?? '', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                            ]),
                          ),
                      ],
                      Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                        if (isSubscriber || isStaff)
                          TextButton(
                            style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                            onPressed: () => _showReplyBox(context, ref, r['id'] as String, username),
                            child: const Text('Yanıtla', style: TextStyle(fontSize: 12)),
                          ),
                        TextButton.icon(
                          style: TextButton.styleFrom(foregroundColor: Colors.red, padding: const EdgeInsets.symmetric(horizontal: 4), tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                          onPressed: () => showDialog(context: context, builder: (_) => ReportDialog(targetType: 'review', targetId: r['id'] as String)),
                          icon: const Icon(Icons.flag_outlined, size: 13),
                          label: const Text('Şikayet', style: TextStyle(fontSize: 12)),
                        ),
                      ]),
                    ]),
                  ),
                ),

              // Mesaj / Engelle / Şikayet
              if (canMessage && !isOwnProfile) ...[
                const SizedBox(height: 16),
                MettloButton(
                  label: 'Koça mesaj yaz',
                  secondary: true,
                  icon: Icons.chat_bubble_outline,
                  onPressed: () async {
                    try {
                      final r = await ref.read(apiClientProvider).post('/messages/conversations', body: {'toUsername': username}) as Map<String, dynamic>;
                      if (context.mounted) context.push('/messages/${r['id']}');
                    } on ApiException catch (e) {
                      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                    }
                  },
                ),
                const SizedBox(height: 8),
                _BlockButton(username: username),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                  onPressed: () => showDialog(context: context, builder: (_) => ReportDialog(targetType: 'user', targetId: username)),
                  icon: const Icon(Icons.flag_outlined, size: 16),
                  label: const Text('Şikayet Et'),
                ),
              ],
              const SizedBox(height: 16),
            ]),
          ),
        ),
        // Admin panel (ADMIN/SUPER_ADMIN için)
        SliverToBoxAdapter(child: ProfileAdminPanel(username: username)),
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }

  String _fmtDate(String? iso) {
    if (iso == null) return '';
    try {
      final d = DateTime.parse(iso).toLocal();
      return DateFormat('d MMM y, HH:mm', 'tr').format(d);
    } catch (_) { return iso; }
  }
}

// ── Block Button ──

class _BlockButton extends ConsumerStatefulWidget {
  const _BlockButton({required this.username});
  final String username;
  @override
  ConsumerState<_BlockButton> createState() => _BlockButtonState();
}

class _BlockButtonState extends ConsumerState<_BlockButton> {
  bool _blocked = false, _busy = false;

  Future<void> _block() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('@${widget.username} Kullanıcısını Engelle'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Engelledikten sonra bu kullanıcı profilinize erişemez.', style: TextStyle(fontSize: 13)),
          const SizedBox(height: 12),
          TextField(controller: ctrl, maxLines: 3, maxLength: 500, decoration: const InputDecoration(labelText: 'Neden engelliyorsunuz?')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Engelle')),
        ],
      ),
    );
    ctrl.dispose();
    if (ok == null || ok.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/blocks', body: {'username': widget.username, 'reason': ok});
      if (mounted) setState(() => _blocked = true);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unblock() async {
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).delete('/blocks/${widget.username}');
      if (mounted) setState(() => _blocked = false);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => _blocked
      ? OutlinedButton.icon(onPressed: _busy ? null : _unblock, icon: const Icon(Icons.shield_outlined, size: 16), label: const Text('Engeli Kaldır'))
      : OutlinedButton.icon(
          style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
          onPressed: _busy ? null : _block,
          icon: const Icon(Icons.block_outlined, size: 16),
          label: const Text('Engelle'),
        );
}

// ── Class Tile ──

class _ClassTile extends ConsumerWidget {
  const _ClassTile({required this.c, required this.isSubscriber, required this.username});
  final Map<String, dynamic> c;
  final bool isSubscriber;
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final when = DateTime.parse(c['startsAt'] as String).toLocal();
    final left = (c['capacity'] as int) - (c['bookedCount'] as int);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(c['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${DateFormat('d MMM y, HH:mm', 'tr').format(when)} · ${left > 0 ? '$left yer boş' : 'dolu'}'),
        trailing: isSubscriber
            ? TextButton(
                onPressed: () async {
                  try {
                    final r = await ref.read(apiClientProvider).post('/classes/${c['id']}/book') as Map<String, dynamic>;
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(r['status'] == 'CONFIRMED' ? 'Rezervasyonun onaylandı' : 'Bekleme listesine alındın (${r['position']}. sıra)')));
                    ref.invalidate(coachClassesProvider(username));
                  } on ApiException catch (e) {
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                  }
                },
                child: Text(left > 0 ? 'Rezervasyon' : 'Bekleme listesi'),
              )
            : null,
      ),
    );
  }
}

// ── Workplace Card ──

class _WorkplaceCard extends StatelessWidget {
  const _WorkplaceCard({required this.w});
  final Map<String, dynamic> w;

  @override
  Widget build(BuildContext context) {
    final coverUrl = imgUrlOrNull(w['coverUrl'] as String?);
    final logoUrl = imgUrlOrNull(w['logoUrl'] as String?);
    final name = w['name'] as String? ?? '';
    final city = (w['city'] as Map<String, dynamic>?)?['name'] as String?;
    final district = (w['district'] as Map<String, dynamic>?)?['name'] as String?;
    final location = [district, city].where((s) => s != null && s.isNotEmpty).join(', ');
    final slug = w['slug'] as String?;

    return GestureDetector(
      onTap: slug != null ? () => context.push('/business/$slug') : null,
      child: Container(
        width: 180,
        margin: const EdgeInsets.only(right: 10),
        decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(MettloRadius.lg), border: Border.all(color: MettloColors.borderSubtle)),
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Stack(children: [
            SizedBox(
              height: 70,
              width: double.infinity,
              child: coverUrl != null
                  ? CachedNetworkImage(imageUrl: coverUrl, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: MettloColors.surface2))
                  : Container(decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF1a1a2e), Color(0xFF16213e)]))),
            ),
            if (logoUrl != null)
              Positioned(
                bottom: -14,
                left: 10,
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: MettloColors.bg, width: 2), color: MettloColors.surface2),
                  clipBehavior: Clip.antiAlias,
                  child: CachedNetworkImage(imageUrl: logoUrl, fit: BoxFit.cover, errorWidget: (_, __, ___) => const SizedBox.shrink()),
                ),
              ),
          ]),
          Padding(
            padding: EdgeInsets.fromLTRB(10, logoUrl != null ? 20 : 8, 10, 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12), overflow: TextOverflow.ellipsis, maxLines: 1),
              if (location.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text('📍 $location', style: const TextStyle(fontSize: 11, color: MettloColors.textTertiary), overflow: TextOverflow.ellipsis, maxLines: 1),
              ],
            ]),
          ),
        ]),
      ),
    );
  }
}

// ── Review Box ──

class _ReviewBox extends ConsumerStatefulWidget {
  const _ReviewBox({required this.username});
  final String username;
  @override
  ConsumerState<_ReviewBox> createState() => _ReviewBoxState();
}

class _ReviewBoxState extends ConsumerState<_ReviewBox> {
  int _rating = 0;
  final _body = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() { _body.dispose(); super.dispose(); }

  Future<void> _send() async {
    if (_body.text.isNotEmpty && Validators.containsExternalContact(_body.text)) {
      setState(() => _error = 'Bağlantı, sosyal medya hesabı, telefon veya e-posta paylaşılamaz.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final res = await ref.read(apiClientProvider).post('/reviews/creators/${widget.username}', body: {'rating': _rating, if (_body.text.trim().isNotEmpty) 'body': _body.text.trim()}) as Map<String, dynamic>;
      ref.invalidate(coachProfileProvider(widget.username));
      ref.invalidate(reviewEligibilityProvider(widget.username));
      if (mounted) {
        final msg = res['pending'] == true ? 'Değerlendirmen incelemeye alındı.' : 'Değerlendirmen yayınlandı, teşekkürler!';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = ref.watch(authControllerProvider).status == AuthStatus.signedIn;
    if (!signedIn) return const InfoBanner('Değerlendirme, yorum ve puan yalnızca koçun abonelerine özeldir.');
    final el = ref.watch(reviewEligibilityProvider(widget.username));
    return el.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (e) {
        final reason = e['reason'];
        if (reason == 'not_subscriber') return const InfoBanner('Değerlendirme, yorum ve puan yalnızca koçun abonelerine özeldir. Abone olup deneyimini paylaşabilirsin.');
        if (reason == 'own_profile') return const SizedBox.shrink();
        if (reason == 'already_reviewed') return InfoBanner('Bu koçu değerlendirdin: ${(e['myReview'] as Map?)?['rating']} / 5. Teşekkürler!');
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Sen de değerlendir', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Row(children: [for (var i = 1; i <= 5; i++) IconButton(visualDensity: VisualDensity.compact, onPressed: () => setState(() => _rating = i), icon: Icon(i <= _rating ? Icons.star : Icons.star_border, color: MettloColors.highlight, size: 30))]),
              TextField(controller: _body, maxLines: 3, maxLength: 1000, decoration: const InputDecoration(hintText: 'Deneyimini paylaş…', helperText: 'Bağlantı, sosyal medya, telefon veya e-posta paylaşılamaz.')),
              if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: InfoBanner(_error!, error: true)),
              const SizedBox(height: 8),
              MettloButton(label: 'Gönder', loading: _busy, onPressed: _rating == 0 ? null : _send),
            ]),
          ),
        );
      },
    );
  }
}
