import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final storyFeedProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final data = await ref.watch(apiClientProvider).get('/social/stories/feed');
  return (data as List?) ?? const [];
});

class StoriesBar extends ConsumerStatefulWidget {
  const StoriesBar({super.key});

  @override
  ConsumerState<StoriesBar> createState() => _StoriesBarState();
}

class _StoriesBarState extends ConsumerState<StoriesBar> {
  void _openUpload() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null || !mounted) return;

    String? caption;
    final captionCtrl = TextEditingController();

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.viewInsetsOf(ctx).bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Hikaye Ekle', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.file(File(picked.path), height: 200, width: double.infinity, fit: BoxFit.cover),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: captionCtrl,
            maxLength: 500,
            decoration: const InputDecoration(hintText: 'Açıklama ekle... (isteğe bağlı)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal'))),
            const SizedBox(width: 10),
            Expanded(child: FilledButton(
              onPressed: () { caption = captionCtrl.text.trim(); Navigator.pop(ctx, true); },
              child: const Text('24 Saat Paylaş'),
            )),
          ]),
        ]),
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await ref.read(apiClientProvider).uploadFile(
        '/social/stories',
        filePath: picked.path,
        fileName: 'story.jpg',
        mimeType: 'image/jpeg',
        fields: caption != null && caption!.isNotEmpty ? {'caption': caption!} : {},
      );
      ref.invalidate(storyFeedProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  void _openViewer(List<dynamic> groups, int groupIdx) {
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _StoryViewer(groups: groups, initialGroup: groupIdx),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(storyFeedProvider);

    return SizedBox(
      height: 92,
      child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 4), children: [
        // + Ekle
        _StoryCircle(
          label: 'Hikaye Ekle',
          isAdd: true,
          onTap: _openUpload,
        ),
        feed.when(
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
          data: (groups) => Row(
            children: [
              for (int i = 0; i < groups.length; i++)
                _StoryCircle(
                  label: (groups[i]['user']['creatorProfile']?['displayName'] ?? groups[i]['user']['name'] as String).split(' ').first,
                  avatarUrl: groups[i]['user']['avatarUrl'] as String?,
                  allViewed: (groups[i]['stories'] as List).every((s) => s['viewed'] == true),
                  onTap: () => _openViewer(groups, i),
                ),
            ],
          ),
        ),
      ]),
    );
  }
}

class _StoryCircle extends StatelessWidget {
  const _StoryCircle({required this.label, this.avatarUrl, this.allViewed = false, this.isAdd = false, required this.onTap});
  final String label;
  final String? avatarUrl;
  final bool allViewed;
  final bool isAdd;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 58, height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: isAdd
                  ? null
                  : allViewed
                      ? const LinearGradient(colors: [Color(0xFF555555), Color(0xFF333333)])
                      : const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFf97316), Color(0xFFef4444), Color(0xFF818cf8)]),
              color: isAdd ? MettloColors.surface2 : null,
              border: isAdd ? Border.all(color: MettloColors.primary, width: 1.5, strokeAlign: BorderSide.strokeAlignOutside) : null,
            ),
            padding: const EdgeInsets.all(2),
            child: Container(
              decoration: BoxDecoration(shape: BoxShape.circle, color: MettloColors.background, border: Border.all(color: MettloColors.background, width: 2)),
              clipBehavior: Clip.antiAlias,
              child: isAdd
                  ? const Icon(Icons.add, color: MettloColors.primary, size: 22)
                  : avatarUrl != null
                      ? Image.network(avatarUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _Initial(label))
                      : _Initial(label),
            ),
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: 62,
            child: Text(
              label,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
              style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary),
            ),
          ),
        ]),
      ),
    );
  }
}

class _Initial extends StatelessWidget {
  const _Initial(this.name);
  final String name;
  @override
  Widget build(BuildContext context) => Container(color: MettloColors.primary, child: Center(child: Text((name.isNotEmpty ? name[0] : '?').toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18))));
}

class _StoryViewer extends ConsumerStatefulWidget {
  const _StoryViewer({required this.groups, required this.initialGroup});
  final List<dynamic> groups;
  final int initialGroup;

  @override
  ConsumerState<_StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends ConsumerState<_StoryViewer> {
  late int groupIdx;
  late int storyIdx;
  double progress = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    groupIdx = widget.initialGroup;
    storyIdx = 0;
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Map<String, dynamic> get currentGroup => widget.groups[groupIdx] as Map<String, dynamic>;
  Map<String, dynamic> get currentStory => (currentGroup['stories'] as List)[storyIdx] as Map<String, dynamic>;

  void _startTimer() {
    _timer?.cancel();
    progress = 0;
    _markViewed();
    final dur = currentStory['mediaType'] == 'VIDEO' ? 15000 : 5000;
    const tick = 100;
    _timer = Timer.periodic(const Duration(milliseconds: tick), (_) {
      setState(() {
        progress += 100 * tick / dur;
        if (progress >= 100) _advance();
      });
    });
  }

  void _markViewed() {
    ref.read(apiClientProvider).post('/social/stories/${currentStory['id']}/view').catchError((_) {});
  }

  void _advance() {
    final stories = (currentGroup['stories'] as List);
    if (storyIdx + 1 < stories.length) {
      setState(() { storyIdx++; progress = 0; });
      _startTimer();
    } else if (groupIdx + 1 < widget.groups.length) {
      setState(() { groupIdx++; storyIdx = 0; progress = 0; });
      _startTimer();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _prev() {
    if (storyIdx > 0) { setState(() { storyIdx--; progress = 0; }); _startTimer(); }
    else if (groupIdx > 0) { setState(() { groupIdx--; storyIdx = 0; progress = 0; }); _startTimer(); }
  }

  @override
  Widget build(BuildContext context) {
    final user = currentGroup['user'] as Map<String, dynamic>;
    final stories = (currentGroup['stories'] as List);
    final mediaUrl = currentStory['mediaUrl'] as String;
    final caption = currentStory['caption'] as String?;
    final viewCount = currentStory['viewCount'] as int? ?? 0;
    final displayName = (user['creatorProfile']?['displayName'] ?? user['name']) as String;
    final avatarUrl = user['avatarUrl'] as String?;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        // Media
        Positioned.fill(
          child: currentStory['mediaType'] == 'IMAGE'
              ? Image.network(mediaUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.broken_image, color: Colors.white)))
              : const Center(child: Icon(Icons.play_circle_outline, color: Colors.white, size: 64)),
        ),

        // Progress bars
        Positioned(
          top: MediaQuery.paddingOf(context).top + 8,
          left: 12, right: 12,
          child: Row(
            children: List.generate(stories.length, (i) => Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: i < storyIdx ? 1.0 : i == storyIdx ? progress / 100 : 0.0,
                    backgroundColor: Colors.white30,
                    valueColor: const AlwaysStoppedAnimation(Colors.white),
                    minHeight: 3,
                  ),
                ),
              ),
            )),
          ),
        ),

        // Header
        Positioned(
          top: MediaQuery.paddingOf(context).top + 20,
          left: 12, right: 12,
          child: Row(children: [
            if (avatarUrl != null)
              CircleAvatar(backgroundImage: NetworkImage(avatarUrl), radius: 18)
            else
              CircleAvatar(backgroundColor: MettloColors.primary, radius: 18, child: Text(displayName[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
            const SizedBox(width: 8),
            Expanded(child: Text(displayName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13))),
            Row(children: [
              const Icon(Icons.remove_red_eye_outlined, color: Colors.white70, size: 15),
              const SizedBox(width: 4),
              Text('$viewCount', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ]),
            const SizedBox(width: 8),
            GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(Icons.close, color: Colors.white, size: 24)),
          ]),
        ),

        // Caption
        if (caption != null && caption.isNotEmpty)
          Positioned(
            bottom: 36,
            left: 16, right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(10)),
              child: Text(caption, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5)),
            ),
          ),

        // Tap nav zones
        Positioned(
          left: 0, top: 60, bottom: 0,
          width: MediaQuery.sizeOf(context).width * 0.4,
          child: GestureDetector(onTap: _prev, behavior: HitTestBehavior.opaque),
        ),
        Positioned(
          right: 0, top: 60, bottom: 0,
          width: MediaQuery.sizeOf(context).width * 0.4,
          child: GestureDetector(onTap: _advance, behavior: HitTestBehavior.opaque),
        ),
      ]),
    );
  }
}
