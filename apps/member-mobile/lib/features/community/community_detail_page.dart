import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final communityDetailProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) async {
  final res = await ref.watch(apiClientProvider).get('/public/communities/${Uri.encodeComponent(slug)}', auth: false);
  return res as Map<String, dynamic>;
});

// null = erişim yok (403), boş liste = henüz paylaşım yok
final communityPostsProvider = FutureProvider.autoDispose.family<_PostsResult, String>((ref, slug) async {
  try {
    final res = await ref.watch(apiClientProvider).get('/communities/${Uri.encodeComponent(slug)}/posts');
    return _PostsResult(items: (res as List?)?.cast<Map<String, dynamic>>() ?? [], forbidden: false);
  } on ApiException catch (e) {
    if (e.status == 403 || e.status == 401) return const _PostsResult(items: [], forbidden: true);
    rethrow;
  }
});

class _PostsResult {
  const _PostsResult({required this.items, required this.forbidden});
  final List<Map<String, dynamic>> items;
  final bool forbidden;
}

class CommunityDetailPage extends ConsumerStatefulWidget {
  const CommunityDetailPage({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<CommunityDetailPage> createState() => _CommunityDetailPageState();
}

class _CommunityDetailPageState extends ConsumerState<CommunityDetailPage> {
  final _ctrl = TextEditingController();
  bool _posting = false;

  Future<void> _post() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _posting = true);
    try {
      await ref.read(apiClientProvider).post('/communities/${Uri.encodeComponent(widget.slug)}/posts', body: {'body': text});
      _ctrl.clear();
      ref.invalidate(communityPostsProvider(widget.slug));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  Future<void> _react(String postId) async {
    try {
      await ref.read(apiClientProvider).post('/posts/$postId/reactions', body: {'type': 'LIKE'});
      ref.invalidate(communityPostsProvider(widget.slug));
    } catch (_) {}
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(communityDetailProvider(widget.slug));
    final posts = ref.watch(communityPostsProvider(widget.slug));
    final auth = ref.watch(authControllerProvider);
    final isSignedIn = auth.status == AuthStatus.signedIn;

    return Scaffold(
      appBar: AppBar(
        title: detail.maybeWhen(data: (d) => Text(d['name'] as String? ?? 'Topluluk'), orElse: () => const Text('Topluluk')),
      ),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Yüklenemedi.', error: true))),
        data: (community) {
          final memberCount = (community['_count'] as Map?)?['members'] as int? ?? 0;
          final postCount = (community['_count'] as Map?)?['posts'] as int? ?? 0;
          final desc = community['description'] as String?;
          final coverUrl = imgUrlOrNull(community['coverUrl'] as String?);

          return Column(children: [
            Expanded(
              child: posts.when(
                loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
                error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Paylaşımlar yüklenemedi.', error: true))),
                data: (result) => RefreshIndicator(
                  color: MettloColors.primary,
                  onRefresh: () async {
                    ref.invalidate(communityDetailProvider(widget.slug));
                    ref.invalidate(communityPostsProvider(widget.slug));
                  },
                  child: ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 16), children: [
                    if (coverUrl != null) ...[
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(MettloRadius.card),
                        child: Image.network(coverUrl, height: 130, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox.shrink()),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Text(community['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22)),
                    const SizedBox(height: 4),
                    Text('$memberCount üye · $postCount paylaşım', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5)),
                    if (desc != null && desc.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(desc, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 14, height: 1.5)),
                    ],
                    const SizedBox(height: 20),
                    if (result.forbidden) ...[
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(MettloRadius.card), border: Border.all(color: MettloColors.borderSubtle)),
                        child: const Column(children: [
                          Icon(Icons.lock_outline, size: 40, color: MettloColors.textMuted),
                          SizedBox(height: 12),
                          Text('Bu topluluk abonelere özel', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          SizedBox(height: 8),
                          Text('Katılmak için topluluğu kuran koça abone olmalısın.', style: TextStyle(color: MettloColors.textSecondary, height: 1.5), textAlign: TextAlign.center),
                        ]),
                      ),
                    ] else if (result.items.isEmpty) ...[
                      const SizedBox(height: 20),
                      const Center(child: Text('Henüz paylaşım yok. İlk paylaşımı sen yap.', style: TextStyle(color: MettloColors.textSecondary), textAlign: TextAlign.center)),
                    ] else ...[
                      ...result.items.map((p) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _PostCard(p, onReact: () => _react(p['id'] as String)))),
                    ],
                  ]),
                ),
              ),
            ),
            if (isSignedIn) _PostInput(controller: _ctrl, posting: _posting, onSend: _post),
          ]);
        },
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard(this.post, {required this.onReact});
  final Map<String, dynamic> post;
  final VoidCallback onReact;

  @override
  Widget build(BuildContext context) {
    final author = post['author'] as Map<String, dynamic>? ?? {};
    final username = author['username'] as String? ?? '';
    final role = author['role'] as String? ?? '';
    final body = post['body'] as String? ?? '';
    final reactions = post['reactions'] as int? ?? 0;
    final comments = post['comments'] as int? ?? 0;
    final isAnnouncement = post['isAnnouncement'] == true;
    final createdAt = DateTime.tryParse(post['createdAt'] as String? ?? '')?.toLocal();
    final timeFmt = createdAt != null
        ? '${createdAt.day.toString().padLeft(2, '0')}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year} ${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}'
        : '';
    final avatarUrl = imgUrlOrNull(author['avatarUrl'] as String?);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: MettloColors.surface1,
        borderRadius: BorderRadius.circular(MettloRadius.card),
        border: Border.all(color: isAnnouncement ? MettloColors.primary.withValues(alpha: .4) : MettloColors.borderSubtle),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          UserAvatar(name: username, url: avatarUrl, size: 34),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Flexible(child: Text('@$username', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5), overflow: TextOverflow.ellipsis)),
              if (role == 'CREATOR') ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(color: MettloColors.primary.withValues(alpha: .12), borderRadius: BorderRadius.circular(MettloRadius.pill)),
                  child: const Text('Koç', style: TextStyle(color: MettloColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ],
              if (isAnnouncement) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(color: MettloColors.error.withValues(alpha: .12), borderRadius: BorderRadius.circular(MettloRadius.pill)),
                  child: const Text('Duyuru', style: TextStyle(color: MettloColors.error, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ],
            ]),
            Text(timeFmt, style: const TextStyle(color: MettloColors.textMuted, fontSize: 11)),
          ])),
        ]),
        const SizedBox(height: 10),
        Text(body, style: const TextStyle(fontSize: 14.5, height: 1.5)),
        const SizedBox(height: 10),
        Row(children: [
          GestureDetector(
            onTap: onReact,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(color: MettloColors.surface2, borderRadius: BorderRadius.circular(MettloRadius.pill)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Text('♥ ', style: TextStyle(fontSize: 13)),
                Text('$reactions', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ]),
            ),
          ),
          const SizedBox(width: 10),
          Row(children: [
            const Icon(Icons.chat_bubble_outline, size: 14, color: MettloColors.textTertiary),
            const SizedBox(width: 4),
            Text('$comments yorum', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 13)),
          ]),
        ]),
      ]),
    );
  }
}

class _PostInput extends StatelessWidget {
  const _PostInput({required this.controller, required this.posting, required this.onSend});
  final TextEditingController controller;
  final bool posting;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: MettloColors.borderSubtle)),
        color: Color(0xFF0F1628),
      ),
      child: SafeArea(
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: controller,
              maxLines: 3,
              minLines: 1,
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Paylaşımını yaz...',
                hintStyle: const TextStyle(color: MettloColors.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.borderSubtle)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.borderSubtle)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(MettloRadius.card), borderSide: const BorderSide(color: MettloColors.primary)),
              ),
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: posting ? null : onSend,
            style: FilledButton.styleFrom(
              backgroundColor: MettloColors.primary,
              padding: const EdgeInsets.all(12),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: posting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.send_rounded, size: 18),
          ),
        ]),
      ),
    );
  }
}
