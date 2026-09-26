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
import '../home/home_page.dart';

final coachProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, u) async => await ref.watch(apiClientProvider).get('/public/profiles/$u', auth: false) as Map<String, dynamic>);
final coachClassesProvider = FutureProvider.autoDispose.family<List<dynamic>, String>((ref, u) async => await ref.watch(apiClientProvider).get('/public/creators/$u/classes', auth: false) as List<dynamic>);
final reviewEligibilityProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, u) async => await ref.watch(apiClientProvider).get('/reviews/creators/$u/eligibility') as Map<String, dynamic>);

const _kStaffRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'];

String _tenure(int months) {
  if (months < 1) return '1 aydan az';
  final y = months ~/ 12, m = months % 12;
  return [if (y > 0) '$y yıl', if (m > 0) '$m ay'].join(' ');
}

void _showReplyBox(BuildContext context, WidgetRef ref, String reviewId, String coachUsername) {
  final ctrl = TextEditingController();
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.viewInsetsOf(ctx).bottom + 16),
      child: StatefulBuilder(
        builder: (_, setS) {
          bool busy = false;
          return Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('Yorumu Yanıtla', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: ctrl, maxLines: 3, maxLength: 1000, decoration: const InputDecoration(hintText: 'Yanıtınızı yazın...')),
            const SizedBox(height: 10),
            Row(mainAxisAlignment: MainAxisAlignment.end, children: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
              FilledButton(
                onPressed: busy
                    ? null
                    : () async {
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
                child: busy
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Gönder'),
              ),
            ]),
          ]);
        },
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
    final isOwnProfile = user?.username == username;
    final isStaff = _kStaffRoles.contains(user?.role);

    return Scaffold(
      appBar: AppBar(
        title: Text('@$username'),
        actions: [
          if (!isOwnProfile && user != null)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (v) {
                if (v == 'report') {
                  showDialog(context: context, builder: (_) => ReportDialog(targetType: 'user', targetId: username));
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'report', child: Row(children: [Icon(Icons.flag_outlined, size: 18, color: Colors.red), SizedBox(width: 8), Text('Şikayet Et')])),
              ],
            ),
        ],
      ),
      body: profile.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) {
          if (e is ApiException && e.status == 404) {
            return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu kullanıcı bulunamamaktadır.'));
          }
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              InfoBanner(e is ApiException ? (e as ApiException).message : 'Bir hata oluştu.', error: true),
              const SizedBox(height: 12),
              MettloButton(label: 'Tekrar Dene', secondary: true, onPressed: () => ref.invalidate(coachProfileProvider(username))),
            ]),
          );
        },
        data: (p) {
          if (p['type'] != 'coach') return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu bir koç profili değil.'));
          return _Body(p: p, username: username, isOwnProfile: isOwnProfile, isStaff: isStaff);
        },
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.p, required this.username, required this.isOwnProfile, required this.isStaff});
  final Map<String, dynamic> p;
  final String username;
  final bool isOwnProfile;
  final bool isStaff;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final st = p['stats'] as Map<String, dynamic>;
    final overview = ref.watch(overviewProvider).asData?.value;
    final isSubscriber = (overview?['subscriptions'] as List?)?.any((s) => s['coach']?['username'] == username) ?? false;
    final tenure = st['tenureBadge'] as Map<String, dynamic>?;
    final classes = ref.watch(coachClassesProvider(username)).asData?.value ?? const [];
    final plans = (p['plans'] as List);
    final reviews = (p['reviews'] as List);
    final dist = (st['ratingDistribution'] as Map);
    final total = (st['ratingCount'] as num?) ?? 0;

    final user = ref.watch(authControllerProvider).user;
    final role = user?.role ?? '';
    final canMessage = ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].contains(role)
        ? true
        : (role == 'ADMIN' ? false : isSubscriber);

    String hours(dynamic v) => (v is num && v == v.roundToDouble()) ? '${v.toInt()}' : NumberFormat('0.0', 'tr').format(v);

    return ListView(padding: const EdgeInsets.fromLTRB(20, 8, 20, 32), children: [
      Row(children: [
        UserAvatar(name: p['displayName'] as String, url: p['avatarUrl'] as String?, size: 84, verified: p['verified'] == true),
        const SizedBox(width: 16),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Flexible(child: Text(p['displayName'] as String, style: Theme.of(context).textTheme.headlineSmall, overflow: TextOverflow.ellipsis)), if (p['verified'] == true) const Padding(padding: EdgeInsets.only(left: 6), child: VerifiedBadge(size: 22))]),
            if (p['headline'] != null) Text(p['headline'] as String, style: const TextStyle(color: MettloColors.textSecondary)),
          ]),
        ),
      ]),
      const SizedBox(height: 14),
      Wrap(spacing: 8, runSpacing: 8, children: [
        if (tenure != null) TenureBadge(tier: tenure['tier'] as String, label: tenure['label'] as String),
        if (st['experienceYears'] != null) Pill('${st['experienceYears']} yıldır eğitmen'),
        Pill('Mettlo\'da ${_tenure((st['monthsOnMettlo'] as num).toInt())}'),
      ]),
      const SizedBox(height: 18),
      if (!isStaff) ...[
        MettloButton(label: isSubscriber ? 'Abonesin ✓' : 'Abone Ol', secondary: isSubscriber, onPressed: isSubscriber ? null : () => launchUrl(Uri.parse('${Env.siteUrl}/profile/$username#plans'), mode: LaunchMode.externalApplication)),
        if (!isSubscriber) const Padding(padding: EdgeInsets.only(top: 8), child: Text('Abonelik ödemesi web sitesinde yapılır; ödeme onaylanınca erişimin uygulamada otomatik açılır.', style: TextStyle(color: MettloColors.textTertiary, fontSize: 12))),
        const SizedBox(height: 18),
      ],
      GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.7, children: [
        StatTile(icon: Icons.people_outline, value: '${st['subscribers']}', label: 'Abone'),
        StatTile(icon: Icons.star_outline, value: total > 0 ? (num.tryParse('${st['ratingAvg']}') ?? 0).toStringAsFixed(1) : '—', label: total > 0 ? '$total değerlendirme' : 'Henüz değerlendirme yok'),
        StatTile(icon: Icons.sensors, value: '${hours(st['liveHours'])} sa', label: 'Canlı ders (${st['liveSessions']} ders)'),
        StatTile(icon: Icons.movie_outlined, value: '${st['videoCount']}', label: 'Video'),
        StatTile(icon: Icons.timer_outlined, value: '${hours(st['videoHours'])} sa', label: 'Toplam video süresi'),
        StatTile(icon: Icons.library_books_outlined, value: '${st['contentTotal']}', label: 'Eğitim içeriği'),
      ]),
      if ((p['credentials'] as List).isNotEmpty) ...[
        const SizedBox(height: 14),
        Wrap(spacing: 8, runSpacing: 8, children: [for (final c in p['credentials'] as List) Pill('✓ $c', color: MettloColors.success)]),
      ],
      if (p['bio'] != null) ...[const SectionTitle('Hakkında'), Text(p['bio'] as String, style: const TextStyle(color: MettloColors.textSecondary, height: 1.5))],
      if (p['whyChooseMe'] != null) ...[
        const SectionTitle('Neden Beni Seçmelisiniz?'),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF111827), Color(0xFF3A1828)]), borderRadius: BorderRadius.circular(MettloRadius.lg), border: Border.all(color: MettloColors.borderHover)),
          child: Text(p['whyChooseMe'] as String, style: const TextStyle(color: MettloColors.textSecondary, height: 1.5)),
        ),
      ],
      if (!isStaff && plans.isNotEmpty) ...[
        const SectionTitle('Abonelik Planları'),
        for (final pl in plans)
          Card(child: ListTile(title: Text(pl['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: pl['description'] != null ? Text(pl['description'] as String) : null, trailing: Text('₺${(num.tryParse('${pl['priceWeb']}') ?? 0).toStringAsFixed(0)} / ${pl['interval'] == 'ANNUAL' ? 'yıl' : 'ay'}', style: const TextStyle(fontWeight: FontWeight.w800, color: MettloColors.primary)))),
      ],
      if (classes.isNotEmpty) ...[
        const SectionTitle('Ders Takvimi'),
        for (final c in classes) _ClassTile(c: c as Map<String, dynamic>, isSubscriber: isSubscriber, username: username),
      ],
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
              if (r['body'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(r['body'] as String, style: const TextStyle(color: MettloColors.textSecondary))),
              Padding(padding: const EdgeInsets.only(top: 8), child: Text(r['author'] != null ? '@${r['author']['username']}' : 'Silinmiş kullanıcı', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12))),
              // Yanıtlar
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
              // Şikayet + Yanıtla satırı
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
      if (canMessage) ...[
        const SizedBox(height: 16),
        MettloButton(label: 'Koça mesaj yaz', secondary: true, icon: Icons.chat_bubble_outline, onPressed: () async {
          try {
            final r = await ref.read(apiClientProvider).post('/messages/conversations', body: {'toUsername': username}) as Map<String, dynamic>;
            if (context.mounted) context.push('/messages/${r['id']}');
          } on ApiException catch (e) {
            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
          }
        }),
      ],
      // Engelle butonu (kendi profili değilse ve giriş yapılmışsa)
      if (!isOwnProfile && user != null) ...[
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
    ]);
  }
}

class _BlockButton extends ConsumerStatefulWidget {
  const _BlockButton({required this.username});
  final String username;

  @override
  ConsumerState<_BlockButton> createState() => _BlockButtonState();
}

class _BlockButtonState extends ConsumerState<_BlockButton> {
  bool _blocked = false;
  bool _busy = false;

  Future<void> _block() async {
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('@${widget.username} Kullanıcısını Engelle'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Engelledikten sonra bu kullanıcı profilinize erişemez, size mesaj gönderemez.', style: TextStyle(fontSize: 13)),
          const SizedBox(height: 12),
          TextField(controller: reasonCtrl, maxLines: 3, maxLength: 500, decoration: const InputDecoration(labelText: 'Neden engelliyorsunuz?')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, reasonCtrl.text.trim()),
            child: const Text('Engelle'),
          ),
        ],
      ),
    );
    reasonCtrl.dispose();
    if (ok == null || ok.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/blocks', body: {'username': widget.username, 'reason': ok});
      if (mounted) setState(() => _blocked = true);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Kullanıcı engellendi.')));
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
  Widget build(BuildContext context) {
    if (_blocked) {
      return OutlinedButton.icon(
        onPressed: _busy ? null : _unblock,
        icon: const Icon(Icons.shield_outlined, size: 16),
        label: const Text('Engeli Kaldır'),
      );
    }
    return OutlinedButton.icon(
      style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
      onPressed: _busy ? null : _block,
      icon: const Icon(Icons.block_outlined, size: 16),
      label: const Text('Engelle'),
    );
  }
}

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
                child: Text(left > 0 ? 'Rezervasyon' : 'Bekleme listesi'))
            : null,
      ),
    );
  }
}

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
  void dispose() {
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_body.text.isNotEmpty && Validators.containsExternalContact(_body.text)) {
      setState(() => _error = 'Bağlantı, sosyal medya hesabı, telefon veya e-posta paylaşılamaz.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).post('/reviews/creators/${widget.username}', body: {'rating': _rating, if (_body.text.trim().isNotEmpty) 'body': _body.text.trim()}) as Map<String, dynamic>;
      ref.invalidate(coachProfileProvider(widget.username));
      ref.invalidate(reviewEligibilityProvider(widget.username));
      if (mounted) {
        final msg = res['pending'] == true
            ? 'Değerlendirmen incelemeye alındı, onaylanınca yayınlanacak.'
            : 'Değerlendirmen yayınlandı, teşekkürler!';
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
