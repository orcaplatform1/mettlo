import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/presence/presence.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/report_dialog.dart';

final conversationsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/messages/conversations') as List<dynamic>);
final threadProvider = FutureProvider.autoDispose.family<List<dynamic>, String>((ref, id) async => await ref.watch(apiClientProvider).get('/messages/conversations/$id') as List<dynamic>);

class MessagesPage extends ConsumerWidget {
  const MessagesPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(conversationsProvider);
    return RefreshIndicator(
      color: MettloColors.primary,
      onRefresh: () async => ref.invalidate(conversationsProvider),
      child: ListView(padding: const EdgeInsets.all(20), children: [
        Text('Mesajlar', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 6),
        const Text('Mesajlaşma izinleri abonelik ve rol durumuna göre belirlenir.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
        const SizedBox(height: 14),
        AsyncBody(
          value: list,
          onRetry: () => ref.invalidate(conversationsProvider),
          builder: (items) => items.isEmpty
              ? const InfoBanner('Henüz konuşman yok. Abone olduğun bir koçun profilinden "Koça mesaj yaz" ile başlat.')
              : Column(children: [
                  for (final c in items)
                    Card(
                      child: ListTile(
                        onTap: () => context.push('/messages/${c['id']}'),
                        leading: UserAvatar(name: (c['with'] as List).isEmpty ? '?' : c['with'][0]['name'] as String, url: (c['with'] as List).isEmpty ? null : c['with'][0]['avatarUrl'] as String?),
                        title: Text((c['with'] as List).map((w) => w['name']).join(', '), style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          if ((c['with'] as List).isNotEmpty) OnlineDot(c['with'][0]['username'] as String, label: true),
                          Text(c['lastMessage'] != null ? '${c['lastMessage']['mine'] == true ? 'Sen: ' : ''}${c['lastMessage']['body']}' : 'Mesaj yok', maxLines: 1, overflow: TextOverflow.ellipsis),
                        ]),
                        trailing: c['unread'] == true ? const Pill('Yeni', color: MettloColors.primary) : null,
                      ),
                    ),
                ]),
        ),
      ]),
    );
  }
}

class ThreadPage extends ConsumerStatefulWidget {
  const ThreadPage({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ThreadPage> createState() => _ThreadPageState();
}

class _ThreadPageState extends ConsumerState<ThreadPage> {
  final _ctrl = TextEditingController();
  bool _busy = false;
  final Set<String> _reportedIds = {};

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/messages/conversations/${widget.id}/messages', body: {'body': text});
      _ctrl.clear();
      ref.invalidate(threadProvider(widget.id));
      ref.invalidate(conversationsProvider);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showMessageOptions(BuildContext context, Map<String, dynamic> m) {
    if (m['mine'] == true) return;
    final msgId = m['id'] as String? ?? '';
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.flag_outlined, color: Colors.red),
            title: const Text('Şikayet Et'),
            onTap: () {
              Navigator.pop(context);
              showDialog(
                context: context,
                builder: (_) => ReportDialog(targetType: 'message', targetId: msgId),
              ).then((_) {
                if (mounted) setState(() => _reportedIds.add(msgId));
              });
            },
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final msgs = ref.watch(threadProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Konuşma')),
      body: Column(children: [
        Expanded(
          child: AsyncBody(
            value: msgs,
            onRetry: () => ref.invalidate(threadProvider(widget.id)),
            builder: (items) => ListView.builder(
              reverse: true,
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final m = items[items.length - 1 - i] as Map<String, dynamic>;
                final mine = m['mine'] == true;
                final msgId = m['id'] as String? ?? '';
                final isReported = _reportedIds.contains(msgId);
                return Align(
                  alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                  child: GestureDetector(
                    onLongPress: mine ? null : () => _showMessageOptions(context, m),
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78),
                      decoration: BoxDecoration(
                        color: mine ? MettloColors.primary.withValues(alpha: .16) : MettloColors.surface2,
                        borderRadius: BorderRadius.circular(16),
                        border: mine ? Border.all(color: MettloColors.primary.withValues(alpha: .3)) : null,
                      ),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                        Text(m['deleted'] == true ? '(silinmiş mesaj)' : (m['body'] ?? '') as String),
                        if (isReported)
                          const Padding(
                            padding: EdgeInsets.only(top: 4),
                            child: Text('Şikayete inceleme başlatıldı', style: TextStyle(fontSize: 11, color: Colors.orange, fontStyle: FontStyle.italic)),
                          ),
                      ]),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: Row(children: [
              Expanded(child: TextField(controller: _ctrl, minLines: 1, maxLines: 4, maxLength: 4000, decoration: const InputDecoration(hintText: 'Mesajını yaz…', counterText: ''))),
              const SizedBox(width: 8),
              IconButton.filled(onPressed: _busy ? null : _send, style: IconButton.styleFrom(backgroundColor: MettloColors.primary), icon: const Icon(Icons.send_rounded)),
            ]),
          ),
        ),
      ]),
    );
  }
}
