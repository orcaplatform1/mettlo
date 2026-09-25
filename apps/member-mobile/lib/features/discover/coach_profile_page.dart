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
import '../home/home_page.dart';

final coachProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, u) async => await ref.watch(apiClientProvider).get('/public/profiles/$u', auth: false) as Map<String, dynamic>);
final coachClassesProvider = FutureProvider.autoDispose.family<List<dynamic>, String>((ref, u) async => await ref.watch(apiClientProvider).get('/public/creators/$u/classes', auth: false) as List<dynamic>);
final reviewEligibilityProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, u) async => await ref.watch(apiClientProvider).get('/reviews/creators/$u/eligibility') as Map<String, dynamic>);

String _tenure(int months) {
  if (months < 1) return '1 aydan az';
  final y = months ~/ 12, m = months % 12;
  return [if (y > 0) '$y yıl', if (m > 0) '$m ay'].join(' ');
}

class CoachProfilePage extends ConsumerWidget {
  const CoachProfilePage({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(coachProfileProvider(username));
    return Scaffold(
      appBar: AppBar(title: Text('@$username')),
      body: AsyncBody(
        value: profile,
        onRetry: () => ref.invalidate(coachProfileProvider(username)),
        builder: (p) {
          if (p['type'] != 'coach') return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu bir koç profili değil.'));
          return _Body(p: p, username: username);
        },
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.p, required this.username});
  final Map<String, dynamic> p;
  final String username;

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
      MettloButton(label: isSubscriber ? 'Abonesin ✓' : 'Abone Ol', secondary: isSubscriber, onPressed: isSubscriber ? null : () => launchUrl(Uri.parse('${Env.siteUrl}/profile/$username#plans'), mode: LaunchMode.externalApplication)),
      if (!isSubscriber) const Padding(padding: EdgeInsets.only(top: 8), child: Text('Abonelik ödemesi web sitesinde yapılır; ödeme onaylanınca erişimin uygulamada otomatik açılır.', style: TextStyle(color: MettloColors.textTertiary, fontSize: 12))),
      const SizedBox(height: 18),
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
      if (plans.isNotEmpty) ...[
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
            ]),
          ),
        ),
      if (isSubscriber) ...[
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
    ]);
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

/// Değerlendirme, yorum ve yıldız YALNIZCA abonelere özeldir.
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
      await ref.read(apiClientProvider).post('/reviews/creators/${widget.username}', body: {'rating': _rating, if (_body.text.trim().isNotEmpty) 'body': _body.text.trim()});
      ref.invalidate(coachProfileProvider(widget.username));
      ref.invalidate(reviewEligibilityProvider(widget.username));
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
