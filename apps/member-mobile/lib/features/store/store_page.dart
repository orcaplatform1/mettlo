import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final productCategoriesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.read(apiClientProvider).get('/public/product-categories', auth: false) as List<dynamic>);

final productsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String?>((ref, categorySlug) async {
  final q = categorySlug != null ? '?category=$categorySlug&limit=30' : '?limit=30';
  return await ref.read(apiClientProvider).get('/public/products$q', auth: false) as Map<String, dynamic>;
});

class StorePage extends ConsumerStatefulWidget {
  const StorePage({super.key});
  @override
  ConsumerState<StorePage> createState() => _StorePageState();
}

class _StorePageState extends ConsumerState<StorePage> {
  String? _category;

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(productCategoriesProvider);
    final data = ref.watch(productsProvider(_category));
    return Scaffold(
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async {
          ref.invalidate(productCategoriesProvider);
          ref.invalidate(productsProvider(_category));
        },
        child: CustomScrollView(slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 52, 20, 20),
              decoration: BoxDecoration(
                color: const Color(0xFF0D0B1F),
                gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [const Color(0xFF0D0B1F), MettloColors.primary.withValues(alpha: .12)]),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('MAĞAZA', style: TextStyle(color: MettloColors.primary, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Text('Mettlo Mağaza', style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 28)),
                const SizedBox(height: 8),
                const Text('Spor giyim, takviye, ekipman ve daha fazlası. Ürünleri yalnızca Mettlo satar ve faturalar.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 14, height: 1.5)),
              ]),
            ),
          ),
          // Kategori filtreleri
          SliverToBoxAdapter(
            child: cats.maybeWhen(
              data: (cs) => cs.isEmpty ? const SizedBox.shrink() : SizedBox(
                height: 48,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  children: [
                    _Chip(label: 'Tümü', active: _category == null, onTap: () => setState(() => _category = null)),
                    for (final c in cs)
                      _Chip(label: c['name'] as String, active: _category == c['slug'], onTap: () => setState(() => _category = c['slug'] as String)),
                  ],
                ),
              ),
              orElse: () => const SizedBox.shrink(),
            ),
          ),
          data.when(
            loading: () => const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: MettloColors.primary)))),
            error: (_, _) => const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(20), child: InfoBanner('Ürünler yüklenemedi. Tekrar dene.', error: true))),
            data: (d) {
              final items = (d['items'] as List?) ?? [];
              if (items.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(children: [
                      Icon(Icons.shopping_bag_outlined, size: 48, color: MettloColors.textMuted),
                      SizedBox(height: 16),
                      Text('Mağaza yakında açılıyor', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                      SizedBox(height: 8),
                      Text('Ürünler satışa çıktığında burada listelenecek.', style: TextStyle(color: MettloColors.textSecondary), textAlign: TextAlign.center),
                    ]),
                  ),
                );
              }
              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: .72),
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _ProductCard(items[i] as Map<String, dynamic>),
                    childCount: items.length,
                  ),
                ),
              );
            },
          ),
        ]),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        color: active ? MettloColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: active ? MettloColors.primary : MettloColors.borderSubtle),
      ),
      child: Text(label, style: TextStyle(fontSize: 12.5, color: active ? Colors.white : MettloColors.textSecondary, fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
    ),
  );
}

class _ProductCard extends StatelessWidget {
  const _ProductCard(this.p);
  final Map<String, dynamic> p;

  @override
  Widget build(BuildContext context) {
    final images = p['images'] as List?;
    final imageUrl = images != null && images.isNotEmpty ? images.first as String? : null;
    final brand = p['brand'] as Map?;
    final price = (p['price'] as num?)?.toDouble() ?? 0;
    final compareAt = (p['compareAtPrice'] as num?)?.toDouble();
    final hasDiscount = compareAt != null && compareAt > price;
    final rating = (p['ratingAvg'] as num?)?.toDouble() ?? 0;
    final slug = p['slug'] as String? ?? '';

    return GestureDetector(
      onTap: () => context.push('/product/$slug'),
      child: Container(
        decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(MettloRadius.card), border: Border.all(color: MettloColors.borderSubtle)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(MettloRadius.card)),
            child: AspectRatio(
              aspectRatio: 1,
              child: imageUrl != null
                  ? CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover, errorWidget: (_, _, _) => _Placeholder())
                  : _Placeholder(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (brand != null)
                Text(brand['name'] as String, style: const TextStyle(color: MettloColors.textTertiary, fontSize: 11, letterSpacing: .5)),
              const SizedBox(height: 3),
              Text(p['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5), maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              Row(children: [
                Text('₺${price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: MettloColors.primary)),
                if (hasDiscount) ...[
                  const SizedBox(width: 6),
                  Text('₺${compareAt!.toStringAsFixed(2)}', style: const TextStyle(decoration: TextDecoration.lineThrough, fontSize: 12, color: MettloColors.textMuted)),
                ],
              ]),
              if (rating > 0) ...[
                const SizedBox(height: 4),
                Row(children: [
                  const Icon(Icons.star, size: 12, color: MettloColors.highlight),
                  const SizedBox(width: 3),
                  Text(rating.toStringAsFixed(1), style: const TextStyle(fontSize: 11.5, color: MettloColors.textSecondary)),
                ]),
              ],
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _Placeholder() => Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF1a0d3d), Color(0xFF0f2a4a)]),
    ),
    child: const Center(child: Icon(Icons.shopping_bag_outlined, size: 36, color: Colors.white24)),
  );
}
