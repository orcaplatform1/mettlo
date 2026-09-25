import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final branchesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/public/branches', auth: false) as List<dynamic>);

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
    return ListView(padding: const EdgeInsets.all(20), children: [
      Text('Keşfet', style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 14),
      TextField(
        controller: _q,
        textInputAction: TextInputAction.search,
        onSubmitted: (v) => setState(() => _query = v.trim()),
        decoration: InputDecoration(hintText: 'Koç ara…', prefixIcon: const Icon(Icons.search), suffixIcon: _query.isEmpty ? null : IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() { _q.clear(); _query = ''; }))),
      ),
      const SizedBox(height: 12),
      SizedBox(
        height: 40,
        child: branches.maybeWhen(
          data: (bs) => ListView(scrollDirection: Axis.horizontal, children: [
            Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: const Text('Tümü'), selected: _branch == null, onSelected: (_) => setState(() => _branch = null), selectedColor: MettloColors.primary.withValues(alpha: .18))),
            for (final b in bs) Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(b['name'] as String), selected: _branch == b['slug'], onSelected: (_) => setState(() => _branch = b['slug'] as String), selectedColor: MettloColors.primary.withValues(alpha: .18))),
          ]),
          orElse: () => const SizedBox.shrink(),
        ),
      ),
      const SizedBox(height: 12),
      AsyncBody(
        value: list,
        onRetry: () => ref.invalidate(creatorsProvider),
        builder: (d) {
          final items = (d['items'] as List);
          if (items.isEmpty) return const Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bu kriterlere uygun koç bulunamadı. Koçlar yayınlandıkça burada listelenecek.'));
          return Column(children: [for (final c in items) _CoachCard(c as Map<String, dynamic>)]);
        },
      ),
    ]);
  }
}

class _CoachCard extends StatelessWidget {
  const _CoachCard(this.c);
  final Map<String, dynamic> c;
  @override
  Widget build(BuildContext context) {
    final username = (c['user'] as Map)['username'] as String;
    final branches = (c['branches'] as List?) ?? const [];
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(MettloRadius.card),
        onTap: () => context.push('/coach/$username'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            UserAvatar(name: c['displayName'] as String, url: (c['user'] as Map)['avatarUrl'] as String?, size: 60, verified: c['verified'] == true),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [Flexible(child: Text(c['displayName'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16), overflow: TextOverflow.ellipsis)), if (c['verified'] == true) const Padding(padding: EdgeInsets.only(left: 6), child: VerifiedBadge())]),
                Text('@$username', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
                if (c['headline'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(c['headline'] as String, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5))),
                const SizedBox(height: 8),
                Wrap(spacing: 6, runSpacing: 6, children: [for (final b in branches.take(3)) Pill(b['name'] as String)]),
                const SizedBox(height: 8),
                Row(children: [
                  const Icon(Icons.people_outline, size: 15, color: MettloColors.textTertiary),
                  Text(' ${c['subscribersCount'] ?? 0} abone', style: const TextStyle(fontSize: 12.5, color: MettloColors.textSecondary)),
                  const SizedBox(width: 14),
                  const Icon(Icons.star, size: 15, color: MettloColors.highlight),
                  Text(' ${(num.tryParse('${c['ratingAvg']}') ?? 0).toStringAsFixed(1)} (${c['ratingCount'] ?? 0})', style: const TextStyle(fontSize: 12.5, color: MettloColors.textSecondary)),
                ]),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
