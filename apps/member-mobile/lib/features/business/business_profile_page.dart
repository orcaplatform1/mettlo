import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';

final businessProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) async =>
    await ref.watch(apiClientProvider).get('/business/${Uri.encodeComponent(slug)}', auth: false) as Map<String, dynamic>);


const _kCategoryLabels = {
  'FITNESS_GYM': 'Spor Salonu', 'PILATES_STUDIO': 'Pilates Stüdyosu',
  'YOGA_STUDIO': 'Yoga Stüdyosu', 'DANCE_STUDIO': 'Dans Stüdyosu',
  'HIIT_STUDIO': 'HIIT Stüdyosu', 'BOXING_GYM': 'Boks Salonu',
  'RUNNING_CLUB': 'Koşu Kulübü', 'WELLNESS_CENTER': 'Wellness Merkezi',
  'NUTRITION_CLINIC': 'Beslenme Kliniği', 'RECOVERY_STUDIO': 'Recovery Stüdyo',
  'SPORTS_CLUB': 'Spor Kulübü', 'OTHER': 'İşletme',
};

class BusinessProfilePage extends ConsumerWidget {
  const BusinessProfilePage({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(businessProfileProvider(slug));
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Yüklenemedi: $e')),
        data: (ba) {
          final isVerified = ba['verificationStatus'] == 'APPROVED';
          final locations = ba['locations'] as List<dynamic>? ?? [];
          final coaches = ba['coachWorkplaces'] as List<dynamic>? ?? [];

          return CustomScrollView(
            slivers: [
              // App bar ile cover
              SliverAppBar(
                expandedHeight: ba['coverUrl'] != null ? 220 : 80,
                pinned: true,
                flexibleSpace: ba['coverUrl'] != null
                    ? FlexibleSpaceBar(
                        background: Image.network(ba['coverUrl'] as String, fit: BoxFit.cover),
                      )
                    : const FlexibleSpaceBar(),
                title: Text(ba['name'] as String, style: const TextStyle(shadows: [Shadow(color: Colors.black54, blurRadius: 8)])),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.qr_code_scanner),
                    tooltip: 'QR Check-in',
                    onPressed: () => context.push('/business/checkin'),
                  ),
                ],
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Logo + başlık
                      Row(children: [
                        if (ba['logoUrl'] != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(ba['logoUrl'] as String, width: 64, height: 64, fit: BoxFit.cover),
                          )
                        else
                          Container(width: 64, height: 64, decoration: BoxDecoration(
                            color: MettloColors.primary.withOpacity(.12), borderRadius: BorderRadius.circular(10)),
                            child: const Icon(Icons.storefront, size: 28, color: MettloColors.primary)),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Flexible(child: Text(ba['name'] as String, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
                            if (isVerified) ...[const SizedBox(width: 6), const Icon(Icons.verified, size: 18, color: MettloColors.primary)],
                          ]),
                          const SizedBox(height: 4),
                          Wrap(spacing: 8, children: [
                            _Chip(_kCategoryLabels[ba['category']] ?? ba['category'] as String),
                            if (ba['city'] != null)
                              _Chip('${ba['city']['name']}${ba['district'] != null ? ', ${ba['district']['name']}' : ''}', icon: Icons.place_outlined),
                          ]),
                        ])),
                      ]),

                      // İstatistikler
                      const SizedBox(height: 16),
                      Row(children: [
                        _StatBox(label: 'Takipçi', value: '${ba['followersCount'] ?? 0}'),
                        const SizedBox(width: 12),
                        if ((ba['ratingCount'] as int? ?? 0) > 0)
                          _StatBox(label: 'Puan', value: '${ba['ratingAvg']} ★'),
                        const SizedBox(width: 12),
                        _StatBox(label: 'Koç', value: '${coaches.length}'),
                      ]),

                      // Butonlar
                      const SizedBox(height: 16),
                      Row(children: [
                        Expanded(child: _FollowButton(businessId: ba['id'] as String, user: user)),
                        if (ba['website'] != null) ...[
                          const SizedBox(width: 10),
                          Expanded(child: _WebsiteButton(businessId: ba['id'] as String, website: ba['website'] as String, apiRef: ref)),
                        ],
                      ]),

                      // Hakkında
                      if (ba['description'] != null) ...[
                        const SizedBox(height: 24),
                        const Text('Hakkında', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        const SizedBox(height: 8),
                        Text(ba['description'] as String, style: TextStyle(color: Colors.grey.shade700, height: 1.5)),
                      ],

                      // Konumlar
                      if (locations.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        const Text('Konumlar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        const SizedBox(height: 8),
                        for (final loc in locations) _LocationTile(loc: loc as Map<String, dynamic>),
                      ],

                      // Koçlar
                      if (coaches.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        const Text('Koçlar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        const SizedBox(height: 8),
                        for (final ww in coaches) _CoachTile(ww: ww as Map<String, dynamic>),
                      ],

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _FollowButton extends ConsumerStatefulWidget {
  const _FollowButton({required this.businessId, required this.user});
  final String businessId;
  final dynamic user;

  @override
  ConsumerState<_FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends ConsumerState<_FollowButton> {
  bool _following = false;
  bool _busy = false;

  Future<void> _toggle() async {
    if (widget.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Takip etmek için giriş yapmalısınız.')));
      return;
    }
    setState(() => _busy = true);
    try {
      if (_following) {
        await ref.read(apiClientProvider).delete('/business/${widget.businessId}/follow');
      } else {
        await ref.read(apiClientProvider).post('/business/${widget.businessId}/follow');
      }
      setState(() => _following = !_following);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FilledButton.tonal(
      onPressed: _busy ? null : _toggle,
      style: _following ? FilledButton.styleFrom(backgroundColor: MettloColors.primary.withOpacity(.12)) : null,
      child: _busy
          ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
          : Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
              Icon(_following ? Icons.person_remove_outlined : Icons.person_add_outlined, size: 16),
              const SizedBox(width: 6),
              Text(_following ? 'Takipten Çık' : 'Takip Et'),
            ]),
    );
  }
}

class _WebsiteButton extends StatelessWidget {
  const _WebsiteButton({required this.businessId, required this.website, required this.apiRef});
  final String businessId;
  final String website;
  final WidgetRef apiRef;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: () async {
        // Tracking — fire-and-forget
        apiRef.read(apiClientProvider).post('/business/$businessId/website-click', body: {'targetUrl': website}).catchError((_) {});
        final uri = Uri.tryParse(website);
        if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
      },
      child: const Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.language, size: 16),
        SizedBox(width: 6),
        Text('Web Sitesi'),
      ]),
    );
  }
}

class _LocationTile extends StatelessWidget {
  const _LocationTile({required this.loc});
  final Map<String, dynamic> loc;

  @override
  Widget build(BuildContext context) {
    final cityStr = (loc['city'] as Map<String, dynamic>?)?['name'] as String? ?? '';
    final districtStr = (loc['district'] as Map<String, dynamic>?)?['name'] as String? ?? '';
    final locationStr = [cityStr, districtStr].where((s) => s.isNotEmpty).join(', ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.place_outlined, size: 18, color: MettloColors.primary),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text(loc['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
            if (loc['isMain'] == true) ...[
              const SizedBox(width: 6),
              Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: MettloColors.primary.withOpacity(.1), borderRadius: BorderRadius.circular(4)),
                child: const Text('Ana Şube', style: TextStyle(fontSize: 10, color: MettloColors.primary, fontWeight: FontWeight.w700))),
            ],
          ]),
          if (loc['address'] != null) Text(loc['address'] as String, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          if (locationStr.isNotEmpty) Text(locationStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
        ])),
        if (loc['lat'] != null && loc['lng'] != null)
          IconButton(
            icon: const Icon(Icons.directions_outlined, size: 18, color: MettloColors.primary),
            tooltip: 'Yol Tarifi Al',
            onPressed: () async {
              final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=${loc['lat']},${loc['lng']}');
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            },
          ),
      ]),
    );
  }
}

class _CoachTile extends StatelessWidget {
  const _CoachTile({required this.ww});
  final Map<String, dynamic> ww;

  @override
  Widget build(BuildContext context) {
    final creator = ww['creator'] as Map<String, dynamic>;
    final user = creator['user'] as Map<String, dynamic>;

    return GestureDetector(
      onTap: () => context.push('/coach/${user['username']}'),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          creator['coverUrl'] != null
              ? ClipRRect(borderRadius: BorderRadius.circular(8),
                  child: Image.network(creator['coverUrl'] as String, width: 44, height: 44, fit: BoxFit.cover))
              : Container(width: 44, height: 44, decoration: BoxDecoration(
                  color: MettloColors.primary.withOpacity(.1), borderRadius: BorderRadius.circular(8)),
                  child: Center(child: Text((creator['displayName'] as String)[0],
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: MettloColors.primary)))),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(creator['displayName'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
            if (creator['headline'] != null) Text(creator['headline'] as String, style: TextStyle(fontSize: 12, color: Colors.grey.shade600), maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          if (creator['ratingAvg'] != null)
            Text('${creator['ratingAvg']} ★', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, color: Colors.grey, size: 18),
        ]),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.label, {this.icon});
  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: MettloColors.primary.withOpacity(.08),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      if (icon != null) ...[Icon(icon, size: 11, color: MettloColors.primary), const SizedBox(width: 3)],
      Text(label, style: const TextStyle(fontSize: 12, color: MettloColors.primary, fontWeight: FontWeight.w600)),
    ]),
  );
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(.5),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Column(children: [
      Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      const SizedBox(height: 2),
      Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
    ]),
  );
}
