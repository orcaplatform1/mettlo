import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';

final coachClientsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/coaching/clients');
  return List<Map<String, dynamic>>.from(res as List);
});

class ClientsPage extends ConsumerWidget {
  const ClientsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(coachClientsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Müşterilerim')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Hata: $e')),
        data: (clients) {
          if (clients.isEmpty) {
            return const Center(child: Text('Henüz aktif müşteri yok', style: TextStyle(color: MettloColors.textSecondary)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: clients.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final c = clients[i];
              final member = c['member'] as Map<String, dynamic>;
              final coaching = c['coaching'] as Map<String, dynamic>?;
              return InkWell(
                onTap: () => ctx.push('/coaching/clients/${member['id']}'),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(12), border: Border.all(color: MettloColors.borderSubtle)),
                  child: Row(
                    children: [
                      CircleAvatar(backgroundImage: member['avatarUrl'] != null ? NetworkImage(member['avatarUrl'] as String) : null, child: member['avatarUrl'] == null ? Text((member['name'] as String)[0].toUpperCase()) : null, radius: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(member['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          Text('@${member['username']}', style: const TextStyle(fontSize: 12, color: MettloColors.textSecondary)),
                          if (coaching?['goal'] != null) Text(coaching!['goal'] as String, style: const TextStyle(fontSize: 11, color: MettloColors.textTertiary), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ]),
                      ),
                      const Icon(Icons.chevron_right, color: MettloColors.textSecondary, size: 18),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
