import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final notificationsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/me/notifications') as List<dynamic>);

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(notificationsProvider);
    final hasUnread = list.asData?.value.any((n) => n['readAt'] == null) ?? false;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          if (hasUnread)
            IconButton(
              icon: const Icon(Icons.done_all),
              tooltip: 'Tümünü okundu işaretle',
              onPressed: () async {
                await ref.read(apiClientProvider).post('/me/notifications/read-all');
                ref.invalidate(notificationsProvider);
              },
            ),
        ],
      ),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: AsyncBody(
          value: list,
          onRetry: () => ref.invalidate(notificationsProvider),
          builder: (items) => items.isEmpty
              ? const Center(child: Padding(padding: EdgeInsets.all(24), child: InfoBanner('Bildirimin yok.')))
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final n = items[i] as Map<String, dynamic>;
                    final unread = n['readAt'] == null;
                    return ListTile(
                      tileColor: unread ? MettloColors.primary.withValues(alpha: .05) : null,
                      leading: Icon(Icons.notifications_outlined,
                          color: unread ? MettloColors.primary : MettloColors.textSecondary),
                      title: Text(n['title'] as String? ?? '',
                          style: TextStyle(fontWeight: unread ? FontWeight.w700 : FontWeight.w400)),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        if (n['body'] != null) Text(n['body'] as String, style: const TextStyle(fontSize: 13)),
                        Text(
                          DateTime.parse(n['createdAt'] as String).toLocal().toString().substring(0, 16),
                          style: const TextStyle(fontSize: 11, color: MettloColors.textTertiary),
                        ),
                      ]),
                      trailing: unread ? const Icon(Icons.circle, size: 8, color: MettloColors.primary) : null,
                    );
                  },
                ),
        ),
      ),
    );
  }
}
