import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';

/// Takip durumunu kontrol eden provider (username bazlı)
final followStatusProvider = FutureProvider.autoDispose.family<bool, String>((ref, username) async {
  final data = await ref.watch(apiClientProvider).get('/social/following/status/$username');
  return (data as Map<String, dynamic>)['following'] == true;
});

/// Kullanıcı takip/takibi bırak butonu
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
      ref.invalidate(followStatusProvider(widget.username));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(followStatusProvider(widget.username));

    return status.when(
      loading: () => const SizedBox(width: 120, height: 38, child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)))),
      error: (_, __) => const SizedBox.shrink(),
      data: (following) => SizedBox(
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
      ),
    );
  }
}

/// Takipçi sayısını tıklanabilir chip olarak gösterir
class FollowersCountChip extends ConsumerStatefulWidget {
  const FollowersCountChip({super.key, required this.username, required this.count});
  final String username;
  final int count;

  @override
  ConsumerState<FollowersCountChip> createState() => _FollowersCountChipState();
}

class _FollowersCountChipState extends ConsumerState<FollowersCountChip> {
  void _showFollowers() async {
    List<dynamic>? followers;
    try {
      followers = (await ref.read(apiClientProvider).get('/social/followers/${widget.username}', auth: false)) as List<dynamic>;
    } catch (_) {}

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        expand: false,
        builder: (_, sc) => Column(children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: MettloColors.border, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 12),
          Text('Takipçiler (${widget.count})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 8),
          if (followers == null || followers.isEmpty)
            const Padding(padding: EdgeInsets.all(24), child: Text('Henüz takipçi yok.', style: TextStyle(color: MettloColors.textSecondary)))
          else
            Expanded(
              child: ListView.separated(
                controller: sc,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: followers.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final f = followers![i] as Map<String, dynamic>;
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundImage: f['avatarUrl'] != null ? NetworkImage(f['avatarUrl'] as String) : null,
                      backgroundColor: MettloColors.primary,
                      child: f['avatarUrl'] == null ? Text((f['name'] as String? ?? '?')[0].toUpperCase(), style: const TextStyle(color: Colors.white)) : null,
                    ),
                    title: Text(f['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Text('@${f['username'] as String? ?? ''}', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12)),
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
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _showFollowers,
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text('${widget.count}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
        const SizedBox(width: 3),
        const Text('Takipçi', style: TextStyle(color: MettloColors.textTertiary, fontSize: 13)),
      ]),
    );
  }
}

/// Karşılıklı takip rozeti
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
