import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final coachAlertsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/coaching/alerts');
  return (res as List?) ?? [];
});

class AlertsPage extends ConsumerWidget {
  const AlertsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(coachAlertsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Uyarılar')),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Uyarılar yüklenemedi.', error: true))),
        data: (items) {
          final active = items.where((a) => a['resolvedAt'] == null).toList();
          final resolved = items.where((a) => a['resolvedAt'] != null).toList();
          if (items.isEmpty) {
            return const Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.check_circle_outline, size: 52, color: MettloColors.textMuted),
                SizedBox(height: 16),
                Text('Aktif uyarı yok', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                SizedBox(height: 8),
                Text('Tüm müşterileriniz iyi görünüyor.', style: TextStyle(color: MettloColors.textSecondary)),
              ]),
            );
          }
          return RefreshIndicator(
            color: MettloColors.primary,
            onRefresh: () async => ref.invalidate(coachAlertsProvider),
            child: ListView(padding: const EdgeInsets.all(16), children: [
              if (active.isNotEmpty) ...[
                const SectionTitle('Aktif'),
                ...active.map((a) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _AlertCard(a, resolved: false))),
              ],
              if (resolved.isNotEmpty) ...[
                const SectionTitle('Çözüldü'),
                ...resolved.map((a) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _AlertCard(a, resolved: true))),
              ],
            ]),
          );
        },
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard(this.alert, {required this.resolved});
  final Map<String, dynamic> alert;
  final bool resolved;

  Color _severityColor() {
    switch (alert['severity'] as String? ?? '') {
      case 'HIGH': return const Color(0xFFef4444);
      case 'MEDIUM': return const Color(0xFFf59e0b);
      default: return const Color(0xFF3b82f6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = alert['title'] as String? ?? '';
    final body = alert['body'] as String?;
    final isRead = alert['isRead'] == true;
    final client = alert['client'] as Map<String, dynamic>?;
    final member = client?['member'] as Map<String, dynamic>?;
    final username = member?['username'] as String? ?? '';
    final name = member?['name'] as String? ?? username;
    final color = _severityColor();
    final date = DateTime.tryParse(alert['createdAt'] as String? ?? '')?.toLocal();
    final dateFmt = date != null ? '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}' : '';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: resolved || isRead ? MettloColors.surface1 : color.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(MettloRadius.card),
        border: Border.all(color: resolved ? MettloColors.borderSubtle : color.withValues(alpha: .5)),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 8,
          height: 8,
          margin: const EdgeInsets.only(top: 5, right: 12),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: resolved ? MettloColors.textMuted : color,
          ),
        ),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5, color: resolved ? MettloColors.textSecondary : MettloColors.textPrimary)),
          if (body != null && body.isNotEmpty) ...[
            const SizedBox(height: 3),
            Text(body, style: const TextStyle(fontSize: 13, color: MettloColors.textSecondary, height: 1.4)),
          ],
          const SizedBox(height: 6),
          Row(children: [
            GestureDetector(
              onTap: () => context.push('/profile/$username'),
              child: Text(name, style: const TextStyle(color: MettloColors.primary, fontSize: 12, fontWeight: FontWeight.w500)),
            ),
            const Text(' · ', style: TextStyle(color: MettloColors.textMuted, fontSize: 12)),
            Text(dateFmt, style: const TextStyle(color: MettloColors.textMuted, fontSize: 12)),
          ]),
        ])),
      ]),
    );
  }
}
