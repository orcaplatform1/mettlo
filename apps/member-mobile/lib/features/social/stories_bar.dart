import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final storyFeedProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final data = await ref.watch(apiClientProvider).get('/social/stories/feed');
  return (data as List?) ?? const [];
});

final _userStoriesProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, username) async =>
    await ref.watch(apiClientProvider).get('/social/stories/user/$username', auth: false) as Map<String, dynamic>);

// ─── StoriesBar (ana sayfa) ───────────────────────────────────────────────────

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
              child: const Text('48 Saat Paylaş'),
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
    final myUsername = ref.read(authControllerProvider).user?.username;
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _StoryViewer(groups: groups, initialGroup: groupIdx, myUsername: myUsername),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(storyFeedProvider);

    return SizedBox(
      height: 92,
      child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 4), children: [
        _StoryCircle(label: 'Hikaye Ekle', isAdd: true, onTap: _openUpload),
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

// ─── ProfileStoriesSection (profil sayfası) ───────────────────────────────────

class ProfileStoriesSection extends ConsumerStatefulWidget {
  const ProfileStoriesSection({super.key, required this.username, required this.isOwn});
  final String username;
  final bool isOwn;

  @override
  ConsumerState<ProfileStoriesSection> createState() => _ProfileStoriesSectionState();
}

class _ProfileStoriesSectionState extends ConsumerState<ProfileStoriesSection> {
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
          TextField(controller: captionCtrl, maxLength: 500, decoration: const InputDecoration(hintText: 'Açıklama ekle... (isteğe bağlı)', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal'))),
            const SizedBox(width: 10),
            Expanded(child: FilledButton(
              onPressed: () { caption = captionCtrl.text.trim(); Navigator.pop(ctx, true); },
              child: const Text('48 Saat Paylaş'),
            )),
          ]),
        ]),
      ),
    );
    captionCtrl.dispose();
    if (confirmed != true || !mounted) return;

    try {
      await ref.read(apiClientProvider).uploadFile('/social/stories', filePath: picked.path, fileName: 'story.jpg', mimeType: 'image/jpeg', fields: caption != null && caption!.isNotEmpty ? {'caption': caption!} : {});
      ref.invalidate(_userStoriesProvider(widget.username));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final storiesAsync = ref.watch(_userStoriesProvider(widget.username));

    return storiesAsync.when(
      loading: () => widget.isOwn ? _buildShell([]) : const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) {
        final stories = (data['stories'] as List?) ?? [];
        if (stories.isEmpty && !widget.isOwn) return const SizedBox.shrink();
        return _buildShell(stories);
      },
    );
  }

  Widget _buildShell(List<dynamic> stories) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 16),
      const Text('DURUMLARIM', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.0, color: MettloColors.textTertiary)),
      const SizedBox(height: 8),
      SizedBox(
        height: 82,
        child: ListView(scrollDirection: Axis.horizontal, children: [
          if (widget.isOwn)
            _StoryCircle(label: 'Hikaye Ekle', isAdd: true, onTap: _openUpload),
          for (int i = 0; i < stories.length; i++)
            _StoryCircle(
              label: '',
              avatarUrl: null,
              previewUrl: stories[i]['mediaUrl'] as String?,
              isVideo: stories[i]['mediaType'] == 'VIDEO',
              onTap: () {
                final myUsername = ref.read(authControllerProvider).user?.username;
                final fakeGroup = [{'user': {'username': widget.username, 'name': widget.username, 'avatarUrl': null, 'creatorProfile': null}, 'stories': stories}];
                Navigator.of(context).push(MaterialPageRoute(
                  fullscreenDialog: true,
                  builder: (_) => _StoryViewer(groups: fakeGroup, initialGroup: 0, initialStory: i, myUsername: myUsername),
                ));
              },
            ),
        ]),
      ),
    ]);
  }
}

// ─── Yardımcı widget'lar ──────────────────────────────────────────────────────

class _StoryCircle extends StatelessWidget {
  const _StoryCircle({required this.label, this.avatarUrl, this.previewUrl, this.isVideo = false, this.allViewed = false, this.isAdd = false, required this.onTap});
  final String label;
  final String? avatarUrl;
  final String? previewUrl;
  final bool isVideo;
  final bool allViewed;
  final bool isAdd;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 58, height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: isAdd ? null : allViewed
                  ? const LinearGradient(colors: [Color(0xFF555555), Color(0xFF333333)])
                  : const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFf97316), Color(0xFFef4444), Color(0xFF818cf8)]),
              color: isAdd ? MettloColors.surface2 : null,
              border: isAdd ? Border.all(color: MettloColors.primary, width: 1.5, strokeAlign: BorderSide.strokeAlignOutside) : null,
            ),
            padding: const EdgeInsets.all(2),
            child: Container(
              decoration: const BoxDecoration(shape: BoxShape.circle, color: MettloColors.background),
              clipBehavior: Clip.antiAlias,
              child: isAdd
                  ? const Icon(Icons.add, color: MettloColors.primary, size: 22)
                  : previewUrl != null
                      ? Stack(fit: StackFit.expand, children: [
                          Image.network(previewUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _Initial(label.isEmpty ? '?' : label)),
                          if (isVideo) const Center(child: Icon(Icons.play_arrow, color: Colors.white, size: 18)),
                        ])
                      : avatarUrl != null
                          ? Image.network(avatarUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _Initial(label))
                          : _Initial(label.isEmpty ? '?' : label),
            ),
          ),
          if (label.isNotEmpty) ...[
            const SizedBox(height: 4),
            SizedBox(width: 62, child: Text(label, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis, maxLines: 1, style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary))),
          ],
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

// ─── Story Viewer ─────────────────────────────────────────────────────────────

class _StoryViewer extends ConsumerStatefulWidget {
  const _StoryViewer({required this.groups, required this.initialGroup, this.initialStory = 0, this.myUsername});
  final List<dynamic> groups;
  final int initialGroup;
  final int initialStory;
  final String? myUsername;

  @override
  ConsumerState<_StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends ConsumerState<_StoryViewer> {
  late int groupIdx;
  late int storyIdx;
  double progress = 0;
  Timer? _timer;

  bool _showViewers = false;
  List<dynamic>? _viewers;
  bool _loadingViewers = false;

  final _replyCtrl = TextEditingController();
  bool _replySending = false;
  bool _replySent = false;

  @override
  void initState() {
    super.initState();
    groupIdx = widget.initialGroup;
    storyIdx = widget.initialStory;
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _replyCtrl.dispose();
    super.dispose();
  }

  Map<String, dynamic> get currentGroup => widget.groups[groupIdx] as Map<String, dynamic>;
  Map<String, dynamic> get currentStory => (currentGroup['stories'] as List)[storyIdx] as Map<String, dynamic>;
  bool get _isOwnStory => widget.myUsername != null && (currentGroup['user'] as Map<String, dynamic>)['username'] == widget.myUsername;

  void _startTimer() {
    _timer?.cancel();
    progress = 0;
    _markViewed();
    final dur = currentStory['mediaType'] == 'VIDEO' ? 15000 : 5000;
    const tick = 100;
    _timer = Timer.periodic(const Duration(milliseconds: tick), (_) {
      if (_showViewers) return; // izleyenler açıkken durdur
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
      setState(() { storyIdx++; progress = 0; _resetReply(); });
      _startTimer();
    } else if (groupIdx + 1 < widget.groups.length) {
      setState(() { groupIdx++; storyIdx = 0; progress = 0; _resetReply(); });
      _startTimer();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _prev() {
    if (storyIdx > 0) { setState(() { storyIdx--; progress = 0; _resetReply(); }); _startTimer(); }
    else if (groupIdx > 0) { setState(() { groupIdx--; storyIdx = 0; progress = 0; _resetReply(); }); _startTimer(); }
  }

  void _resetReply() { _replySent = false; _replyCtrl.clear(); _showViewers = false; _viewers = null; }

  void _openViewers() async {
    setState(() { _showViewers = true; });
    if (_viewers != null) return;
    setState(() => _loadingViewers = true);
    try {
      final data = await ref.read(apiClientProvider).get('/social/stories/${currentStory['id']}/viewers');
      if (mounted) setState(() => _viewers = (data as List?) ?? []);
    } catch (_) {
      if (mounted) setState(() => _viewers = []);
    } finally {
      if (mounted) setState(() => _loadingViewers = false);
    }
  }

  Future<void> _sendReply() async {
    final text = _replyCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _replySending = true);
    try {
      await ref.read(apiClientProvider).post('/social/stories/${currentStory['id']}/reply', body: {'text': text});
      if (mounted) setState(() { _replySent = true; _replyCtrl.clear(); });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _replySending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = currentGroup['user'] as Map<String, dynamic>;
    final stories = (currentGroup['stories'] as List);
    final mediaUrl = currentStory['mediaUrl'] as String;
    final caption = currentStory['caption'] as String?;
    final viewCount = (currentStory['viewCount'] as int?) ?? 0;
    final displayName = (user['creatorProfile']?['displayName'] ?? user['name']) as String;
    final avatarUrl = user['avatarUrl'] as String?;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Stack(children: [
          // Medya
          Positioned.fill(
            child: currentStory['mediaType'] == 'IMAGE'
                ? Image.network(mediaUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.broken_image, color: Colors.white)))
                : const Center(child: Icon(Icons.play_circle_outline, color: Colors.white, size: 64)),
          ),

          // Progress bars
          Positioned(
            top: 8, left: 12, right: 12,
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
            top: 20, left: 12, right: 12,
            child: Row(children: [
              if (avatarUrl != null)
                CircleAvatar(backgroundImage: NetworkImage(avatarUrl), radius: 18)
              else
                CircleAvatar(backgroundColor: MettloColors.primary, radius: 18, child: Text(displayName[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
              const SizedBox(width: 8),
              Expanded(child: Text(displayName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13))),
              // Göz ikonu: kendi hikayesinde izleyenler, başkasında sayı
              if (_isOwnStory)
                GestureDetector(
                  onTap: _openViewers,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.remove_red_eye_outlined, color: Colors.white70, size: 15),
                      const SizedBox(width: 4),
                      Text('$viewCount', style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                )
              else
                Row(children: [
                  const Icon(Icons.remove_red_eye_outlined, color: Colors.white54, size: 14),
                  const SizedBox(width: 4),
                  Text('$viewCount', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                ]),
              const SizedBox(width: 8),
              GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(Icons.close, color: Colors.white, size: 24)),
            ]),
          ),

          // Caption
          if (caption != null && caption.isNotEmpty)
            Positioned(
              bottom: !_isOwnStory ? 72 : 16,
              left: 16, right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(10)),
                child: Text(caption, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5)),
              ),
            ),

          // Yanıt alanı (başkasının hikayesinde)
          if (!_isOwnStory)
            Positioned(
              bottom: bottom,
              left: 0, right: 0,
              child: Container(
                color: Colors.black87,
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
                child: _replySent
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Text('✓ Yanıtın gönderildi', style: TextStyle(color: MettloColors.primary, fontSize: 13), textAlign: TextAlign.center),
                      )
                    : Row(children: [
                        Expanded(
                          child: TextField(
                            controller: _replyCtrl,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            maxLength: 500,
                            maxLines: 1,
                            decoration: InputDecoration(
                              hintText: 'Hikayeye yanıt ver…',
                              hintStyle: const TextStyle(color: Colors.white38),
                              counterText: '',
                              filled: true,
                              fillColor: Colors.white12,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _replySending ? null : _sendReply,
                          child: AnimatedBuilder(
                            animation: _replyCtrl,
                            builder: (_, __) => Container(
                              width: 38, height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _replyCtrl.text.trim().isNotEmpty ? MettloColors.primary : Colors.white12,
                              ),
                              child: _replySending
                                  ? const Center(child: SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
                                  : const Icon(Icons.send_rounded, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ]),
              ),
            ),

          // Dokunma nav alanları (caption + reply alanının üstünde)
          if (!_showViewers) ...[
            Positioned(
              left: 0, top: 60, bottom: !_isOwnStory ? 70 : 0,
              width: MediaQuery.sizeOf(context).width * 0.4,
              child: GestureDetector(onTap: _prev, behavior: HitTestBehavior.opaque),
            ),
            Positioned(
              right: 0, top: 60, bottom: !_isOwnStory ? 70 : 0,
              width: MediaQuery.sizeOf(context).width * 0.4,
              child: GestureDetector(onTap: _advance, behavior: HitTestBehavior.opaque),
            ),
          ],

          // İzleyenler bottom sheet
          if (_showViewers && _isOwnStory)
            Positioned.fill(
              child: GestureDetector(
                onTap: () => setState(() => _showViewers = false),
                child: Container(color: Colors.transparent),
              ),
            ),
          if (_showViewers && _isOwnStory)
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: GestureDetector(
                onTap: () {}, // tıklamayı yukarıya geçirme
                child: Container(
                  constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.6),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F0F0F),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                    boxShadow: [BoxShadow(color: Colors.black54, blurRadius: 40, offset: Offset(0, -8))],
                  ),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Center(child: Container(margin: const EdgeInsets.only(top: 12, bottom: 4), width: 36, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)))),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                      child: Row(children: [
                        const Icon(Icons.remove_red_eye_outlined, color: Colors.white70, size: 16),
                        const SizedBox(width: 8),
                        Text('$viewCount Görüntülenme', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => setState(() => _showViewers = false),
                          child: Container(padding: const EdgeInsets.all(6), decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white10), child: const Icon(Icons.close, color: Colors.white, size: 16)),
                        ),
                      ]),
                    ),
                    Flexible(
                      child: _loadingViewers
                          ? const Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: MettloColors.primary))
                          : (_viewers == null || _viewers!.isEmpty)
                              ? const Padding(padding: EdgeInsets.all(32), child: Text('Henüz kimse görmedi', style: TextStyle(color: Colors.white38)))
                              : ListView.builder(
                                  shrinkWrap: true,
                                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                                  itemCount: _viewers!.length,
                                  itemBuilder: (_, i) {
                                    final v = (_viewers![i]['viewer'] as Map<String, dynamic>);
                                    final viewedAt = DateTime.tryParse(_viewers![i]['viewedAt'] as String? ?? '') ?? DateTime.now();
                                    final timeStr = '${viewedAt.day} ${_monthTr(viewedAt.month)} ${viewedAt.hour.toString().padLeft(2, '0')}:${viewedAt.minute.toString().padLeft(2, '0')}';
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: Row(children: [
                                        CircleAvatar(radius: 22, backgroundImage: v['avatarUrl'] != null ? NetworkImage(v['avatarUrl'] as String) : null, backgroundColor: MettloColors.primary, child: v['avatarUrl'] == null ? Text((v['name'] as String? ?? '?')[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)) : null),
                                        const SizedBox(width: 12),
                                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text(v['name'] as String? ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                                          Text('@${v['username']}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                                        ])),
                                        Text(timeStr, style: const TextStyle(color: Colors.white38, fontSize: 11)),
                                      ]),
                                    );
                                  },
                                ),
                    ),
                  ]),
                ),
              ),
            ),
        ]),
      ),
    );
  }

  String _monthTr(int m) => const ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][m];
}
