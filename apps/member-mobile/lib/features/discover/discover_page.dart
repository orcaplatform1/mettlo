import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/ad_banner_widget.dart';


final branchesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/public/branches', auth: false) as List<dynamic>);

final creatorsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, ({String q, String? branch})>((ref, f) async {
  final res = await ref.watch(apiClientProvider).get('/public/creators', auth: false, query: {'limit': 30, if (f.q.isNotEmpty) 'q': f.q, 'branch': ?f.branch});
  return res as Map<String, dynamic>;
});

class DiscoverPage extends ConsumerStatefulWidget {
  const DiscoverPage({super.key});
  @override
  ConsumerState<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends ConsumerState<DiscoverPage> {
  final _q = TextEditingController();
  String _query = '';
  String? _branch;

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final branches = ref.watch(branchesProvider);
    final list = ref.watch(creatorsProvider((q: _query, branch: _branch)));

    return CustomScrollView(
      slivers: [
        // Hero başlık
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            decoration: BoxDecoration(
              color: const Color(0xFF0D0B1F),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFF0D0B1F),
                  MettloColors.accent.withValues(alpha: .15),
                ],
              ),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('KOÇLAR', style: TextStyle(color: MettloColors.primary, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
              const SizedBox(height: 8),
              Text('Sana uygun koçu bul', style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 28)),
              const SizedBox(height: 8),
              const Text('Fitness, yoga, pilates ve daha fazlası için doğrulanmış koçlar.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 15, height: 1.5)),
              const SizedBox(height: 20),
              // Arama
              TextField(
                controller: _q,
                textInputAction: TextInputAction.search,
                onSubmitted: (v) => setState(() => _query = v.trim()),
                decoration: InputDecoration(
                  hintText: 'Koç ara…',
                  prefixIcon: const Icon(Icons.search, color: MettloColors.textMuted),
                  suffixIcon: _query.isEmpty ? null : IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => setState(() { _q.clear(); _query = ''; }),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ]),
          ),
        ),

        // Kategori filtreleri
        SliverToBoxAdapter(
          child: SizedBox(
            height: 52,
            child: branches.maybeWhen(
              data: (bs) => ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  _BranchChip(label: 'Tümü', active: _branch == null, onTap: () => setState(() => _branch = null)),
                  for (final b in bs)
                    _BranchChip(
                      label: b['name'] as String,
                      active: _branch == b['slug'],
                      onTap: () => setState(() => _branch = _branch == b['slug'] ? null : b['slug'] as String),
                    ),
                ],
              ),
              orElse: () => const SizedBox.shrink(),
            ),
          ),
        ),

        // Koç listesi
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          sliver: list.when(
            loading: () => const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: MettloColors.primary)))),
            error: (e, _) => SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: InfoBanner('Yüklenemedi. Tekrar dene.', error: true))),
            data: (d) {
              final items = (d['items'] as List).cast<Map<String, dynamic>>();
              if (items.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu kriterlere uygun koç bulunamadı. Koçlar yayınlandıkça burada listelenecek.')),
                );
              }
              return SliverToBoxAdapter(
                child: Column(children: [
                  for (int i = 0; i < items.length; i++) ...[
                    _CoachCard(items[i]),
                    const SizedBox(height: 12),
                    if (i == 5) ...[const AdBannerWidget(placement: 'FEED'), const SizedBox(height: 12)],
                  ],
                  const Padding(
                    padding: EdgeInsets.only(top: 4, bottom: 8),
                    child: Text('© 2025 Mettlo. Tüm hakları saklıdır.', style: TextStyle(color: MettloColors.textMuted, fontSize: 11), textAlign: TextAlign.center),
                  ),
                ]),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _BranchChip extends StatelessWidget {
  const _BranchChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
          decoration: BoxDecoration(
            color: active ? MettloColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(MettloRadius.pill),
            border: Border.all(color: active ? MettloColors.primary : MettloColors.borderSubtle, width: 1.5),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: active ? Colors.white : MettloColors.textSecondary,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      );
}

class _CoachCard extends StatelessWidget {
  const _CoachCard(this.c);
  final Map<String, dynamic> c;

  @override
  Widget build(BuildContext context) {
    final username = (c['user'] as Map)['username'] as String;
    final avatarUrl = imgUrlOrNull((c['user'] as Map)['avatarUrl'] as String?);
    final bannerUrl = imgUrlOrNull(c['coverUrl'] as String?);
    final branches = (c['branches'] as List?) ?? const [];
    final rating = num.tryParse('${c['ratingAvg']}') ?? 0;
    final ratingCount = c['ratingCount'] ?? 0;
    final subsCount = c['subscribersCount'] ?? 0;

    return GestureDetector(
      onTap: () => context.push('/coach/$username'),
      child: Container(
        decoration: BoxDecoration(
          color: MettloColors.surface1,
          borderRadius: BorderRadius.circular(MettloRadius.card),
          border: Border.all(color: MettloColors.borderSubtle),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Banner + avatar
          Stack(
            clipBehavior: Clip.none,
            children: [
              // Banner
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(MettloRadius.card)),
                child: SizedBox(
                  height: 120,
                  width: double.infinity,
                  child: bannerUrl != null
                      ? CachedNetworkImage(imageUrl: bannerUrl, fit: BoxFit.cover, errorWidget: (_, _, _) => _defaultBanner())
                      : _defaultBanner(),
                ),
              ),
              // Avatar
              Positioned(
                bottom: -28,
                left: 16,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: MettloColors.surface1, width: 3),
                  ),
                  child: UserAvatar(name: c['displayName'] as String, url: avatarUrl, size: 56, verified: c['verified'] == true),
                ),
              ),
              // Verified badge (top right)
              if (c['verified'] == true)
                const Positioned(
                  bottom: -24,
                  left: 52,
                  child: VerifiedBadge(size: 20),
                ),
            ],
          ),

          // İçerik
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 36, 16, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                c['displayName'] as String,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
              ),
              const SizedBox(height: 2),
              Text('@$username', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 13)),
              if (c['headline'] != null) ...[
                const SizedBox(height: 6),
                Text(c['headline'] as String, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 14, height: 1.4), maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
              if (branches.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  for (final b in branches.take(3)) Pill(b['name'] as String),
                ]),
              ],
              const SizedBox(height: 10),
              Row(children: [
                const Icon(Icons.people_outline, size: 14, color: MettloColors.textTertiary),
                const SizedBox(width: 4),
                Text('$subsCount abone', style: const TextStyle(fontSize: 12.5, color: MettloColors.textSecondary)),
                const SizedBox(width: 16),
                const Icon(Icons.star, size: 14, color: MettloColors.highlight),
                const SizedBox(width: 4),
                Text('${rating.toStringAsFixed(1)} ($ratingCount)', style: const TextStyle(fontSize: 12.5, color: MettloColors.textSecondary)),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _defaultBanner() => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [MettloColors.primary.withValues(alpha: .5), MettloColors.accent.withValues(alpha: .4)],
          ),
        ),
      );
}
