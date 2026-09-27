import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';

// Tam follow verisi: isFollowing, followers count, following count
final followDataProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, username) async {
  final data = await ref.watch(apiClientProvider).get('/social/following/status/$username');
  return data as Map<String, dynamic>;
});

class FollowButton extends ConsumerStatefulWidget {
  const FollowButton({super.key, required this.username});
  final String username;

  @override
  ConsumerState<FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends ConsumerState<FollowButton> {
  bool _loading = false;

  Future<void> _toggle(bool currentlyFollowing) async {
    setState(() => _loading = true);
    try {
      if (currentlyFollowing) {
        await ref.read(apiClientProvider).delete('/me/follow/${widget.username}');
      } else {
        await ref.read(apiClientProvider).post('/me/follow/${widget.username}');
      }
      ref.invalidate(followDataProvider(widget.username));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(followDataProvider(widget.username));

    return status.when(
      loading: () => const SizedBox(width: 120, height: 38, child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)))),
      error: (_, __) => const SizedBox.shrink(),
      data: (d) {
        final following = d['isFollowing'] == true;
        return SizedBox(
          height: 38,
          child: _loading
              ? const SizedBox(width: 120, child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))))
              : following
                  ? OutlinedButton.icon(
                      onPressed: () => _toggle(true),
                      icon: const Icon(Icons.check, size: 16, color: MettloColors.primary),
                      label: const Text('Takip Ediliyor', style: TextStyle(color: MettloColors.primary, fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: MettloColors.primary),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    )
                  : FilledButton.icon(
                      onPressed: () => _toggle(false),
                      icon: const Icon(Icons.person_add_outlined, size: 16),
                      label: const Text('Takip Et', style: TextStyle(fontSize: 13)),
                      style: FilledButton.styleFrom(
                        backgroundColor: MettloColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
        );
      },
    );
  }
}

// Takipçi + Takip Edilen — büyük bold sayılar, web ile birebir aynı
class FollowStats extends ConsumerWidget {
  const FollowStats({super.key, required this.username, required this.followersCount, required this.followingCount});
  final String username;
  final int followersCount;
  final int followingCount;

  void _showList(BuildContext context, WidgetRef ref, String type) async {
    final endpoint = type == 'followers' ? '/social/followers/$username' : '/social/following/$username';
    List<dynamic>? items;
    try {
      items = (await ref.read(apiClientProvider).get(endpoint, auth: false)) as List<dynamic>;
    } catch (_) {}

    if (!context.mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.55,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        expand: false,
        builder: (_, sc) => Column(children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: MettloColors.borderSubtle, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 12),
          Text(type == 'followers' ? 'Takipçiler ($followersCount)' : 'Takip Edilenler ($followingCount)', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 8),
          if (items == null || items.isEmpty)
            const Padding(padding: EdgeInsets.all(24), child: Text('Henüz kimse yok.', style: TextStyle(color: MettloColors.textSecondary)))
          else
            Expanded(
              child: ListView.separated(
                controller: sc,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final f = items![i] as Map<String, dynamic>;
                  final uname = f['username'] as String? ?? '';
                  return ListTile(
                    onTap: () { Navigator.pop(ctx); context.push('/profile/$uname'); },
                    leading: CircleAvatar(
                      backgroundImage: f['avatarUrl'] != null ? NetworkImage(f['avatarUrl'] as String) : null,
                      backgroundColor: MettloColors.primary,
                      child: f['avatarUrl'] == null ? Text((f['name'] as String? ?? '?')[0].toUpperCase(), style: const TextStyle(color: Colors.white)) : null,
                    ),
                    title: Text(f['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Text('@$uname', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12)),
                    contentPadding: EdgeInsets.zero,
                  );
                },
              ),
            ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      GestureDetector(
        onTap: () => _showList(context, ref, 'followers'),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('$followersCount', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.8)),
          const SizedBox(width: 5),
          const Text('Takipçi', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: MettloColors.textSecondary)),
        ]),
      ),
      const SizedBox(width: 24),
      GestureDetector(
        onTap: () => _showList(context, ref, 'following'),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('$followingCount', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.8)),
          const SizedBox(width: 5),
          const Text('Takip', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: MettloColors.textSecondary)),
        ]),
      ),
    ]);
  }
}

// Geriye dönük uyumluluk
class FollowersCountChip extends ConsumerWidget {
  const FollowersCountChip({super.key, required this.username, required this.count});
  final String username;
  final int count;

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      FollowStats(username: username, followersCount: count, followingCount: 0);
}

class MutualFollowBadge extends ConsumerWidget {
  const MutualFollowBadge({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mutual = ref.watch(FutureProvider.autoDispose.family<bool, String>((ref, u) async {
      final d = await ref.watch(apiClientProvider).get('/social/mutual/$u');
      return (d as Map)['mutual'] == true;
    })(username));

    return mutual.whenOrNull(data: (isMutual) => isMutual
        ? Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0x1F34D399),
              border: Border.all(color: const Color(0x4034D399)),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.check_circle_outline, size: 12, color: Color(0xFF34D399)),
              SizedBox(width: 4),
              Text('Karşılıklı Takip', style: TextStyle(fontSize: 11, color: Color(0xFF34D399), fontWeight: FontWeight.w600)),
            ]),
          )
        : const SizedBox.shrink()) ?? const SizedBox.shrink();
  }
}
