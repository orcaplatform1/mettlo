import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final communityListProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, int>((ref, page) async {
  final res = await ref.watch(apiClientProvider).get('/public/communities?limit=20&page=$page', auth: false);
  return res as Map<String, dynamic>;
});

final myCommunityProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  try {
    final res = await ref.watch(apiClientProvider).get('/me/communities');
    return (res as List?) ?? [];
  } catch (_) { return []; }
});

class CommunityPage extends ConsumerStatefulWidget {
  const CommunityPage({super.key});
  @override
  ConsumerState<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends ConsumerState<CommunityPage> with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluk'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [Tab(text: 'Keşfet'), Tab(text: 'Topluluklarım')],
        ),
      ),
      body: TabBarView(controller: _tabs, children: [
        _AllCommunities(),
        _MyCommunities(),
      ]),
    );
  }
}

class _AllCommunities extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(communityListProvider(1));
    return data.when(
      loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
      error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Yüklenemedi.', error: true))),
      data: (d) {
        final items = (d['items'] as List?) ?? [];
        if (items.isEmpty) {
          return _Empty(icon: Icons.people_outline, title: 'Topluluk bulunamadı', body: 'Topluluklar oluşturuldukça burada listelenecek.');
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (_, i) => _CommunityCard(items[i] as Map<String, dynamic>),
        );
      },
    );
  }
}

class _MyCommunities extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(myCommunityProvider);
    return data.when(
      loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
      error: (_, _) => const _Empty(icon: Icons.people_outline, title: 'Toplulukların yok', body: 'Bir topluluğa katıl veya abone olduğun koçun topluluğuna eriş.'),
      data: (items) {
        if (items.isEmpty) {
          return const _Empty(icon: Icons.people_outline, title: 'Toplulukların yok', body: 'Bir topluluğa katıl veya abone olduğun koçun topluluğuna eriş.');
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (_, i) => _CommunityCard(items[i] as Map<String, dynamic>),
        );
      },
    );
  }
}

class _CommunityCard extends StatelessWidget {
  const _CommunityCard(this.c);
  final Map<String, dynamic> c;

  @override
  Widget build(BuildContext context) {
    final name = c['name'] as String? ?? '';
    final desc = c['description'] as String?;
    final memberCount = c['_count']?['members'] as int? ?? c['memberCount'] as int? ?? 0;
    final slug = c['slug'] as String? ?? '';
    final coverUrl = imgUrlOrNull(c['coverUrl'] as String?);
    final isPrivate = c['isPrivate'] == true;

    return GestureDetector(
      onTap: () => context.push('/community/$slug'),
      child: Container(
        decoration: BoxDecoration(
          color: MettloColors.surface1,
          borderRadius: BorderRadius.circular(MettloRadius.card),
          border: Border.all(color: MettloColors.borderSubtle),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (coverUrl != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(MettloRadius.card)),
              child: CachedNetworkImage(imageUrl: coverUrl, height: 100, width: double.infinity, fit: BoxFit.cover, errorWidget: (_, _, _) => const SizedBox.shrink()),
            ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                if (isPrivate) Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: MettloColors.primary.withValues(alpha: .12), borderRadius: BorderRadius.circular(MettloRadius.pill)),
                  child: const Text('Özel', style: TextStyle(color: MettloColors.primary, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ]),
              if (desc != null && desc.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(desc.length > 120 ? '${desc.substring(0, 120)}…' : desc, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5, height: 1.4)),
              ],
              const SizedBox(height: 10),
              Row(children: [
                const Icon(Icons.people_outline, size: 14, color: MettloColors.textTertiary),
                const SizedBox(width: 4),
                Text('$memberCount üye', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 12)),
                const Spacer(),
                const Icon(Icons.chevron_right, size: 18, color: MettloColors.textMuted),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title, body;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 48, color: MettloColors.textMuted),
        const SizedBox(height: 16),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text(body, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 14, height: 1.6), textAlign: TextAlign.center),
      ]),
    ),
  );
}
