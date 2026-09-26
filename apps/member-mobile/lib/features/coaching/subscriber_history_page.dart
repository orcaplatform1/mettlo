import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final subscriberHistoryProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/coaching/subscriber-history') as List<dynamic>);

const _statusLabel = {
  'ACTIVE': 'Aktif',
  'PAST_DUE': 'Gecikmiş',
  'PAUSED': 'Duraklatıldı',
  'CANCELLED': 'İptal edildi',
  'EXPIRED': 'Süresi doldu',
};

const _intervalLabel = {
  'MONTHLY': 'aylık',
  'QUARTERLY': '3 aylık',
  'BIANNUAL': '6 aylık',
  'ANNUAL': 'yıllık',
};

class SubscriberHistoryPage extends ConsumerWidget {
  const SubscriberHistoryPage({super.key});

  String _fmt(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso)?.toLocal();
    return d == null ? '' : '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'ACTIVE': return MettloColors.success;
      case 'PAST_DUE': return MettloColors.warning;
      default: return MettloColors.error;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hist = ref.watch(subscriberHistoryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Abonelerim')),
      body: hist.when(
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
        error: (_, _) => const Center(child: Text('Veriler yüklenemedi.')),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('Henüz abonen yok.', style: TextStyle(color: MettloColors.textSecondary)));
          }
          final active = list.where((s) => ['ACTIVE', 'PAST_DUE', 'PAUSED'].contains(s['status'])).toList();
          final past = list.where((s) => ['CANCELLED', 'EXPIRED'].contains(s['status'])).toList();
          final totalRevenue = list.fold<double>(0, (sum, s) => sum + ((s['totalPaid'] as num?)?.toDouble() ?? 0));

          return RefreshIndicator(
            color: MettloColors.primary,
            onRefresh: () async => ref.invalidate(subscriberHistoryProvider),
            child: ListView(padding: const EdgeInsets.all(16), children: [
              // Özet
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(12), border: Border.all(color: MettloColors.borderSubtle)),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _SummaryTile(label: 'Aktif', value: '${active.length}'),
                  _SummaryTile(label: 'Geçmiş', value: '${past.length}'),
                  _SummaryTile(label: 'Toplam Gelir', value: '${totalRevenue.toStringAsFixed(2)} ₺'),
                ]),
              ),
              const SizedBox(height: 20),

              if (active.isNotEmpty) ...[
                const SectionTitle('Aktif Aboneler'),
                ...active.map((s) => _SubCard(s: s, fmtDate: _fmt, statusColor: _statusColor)),
              ],

              if (past.isNotEmpty) ...[
                const SectionTitle('Geçmiş Aboneler'),
                ...past.map((s) => _SubCard(s: s, fmtDate: _fmt, statusColor: _statusColor)),
              ],
            ]),
          );
        },
      ),
    );
  }
}

class _SubCard extends StatelessWidget {
  const _SubCard({required this.s, required this.fmtDate, required this.statusColor});
  final Map s;
  final String Function(String?) fmtDate;
  final Color Function(String) statusColor;

  @override
  Widget build(BuildContext context) {
    final member = s['member'] as Map;
    final plan = s['plan'] as Map;
    final status = s['status'] as String;
    final totalPaid = (s['totalPaid'] as num?)?.toDouble() ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/coach/${member['username']}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            UserAvatar(name: member['name'] ?? member['username'], url: member['avatarUrl'], size: 46),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(member['name'] ?? member['username'], style: const TextStyle(fontWeight: FontWeight.w600))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: statusColor(status).withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
                  child: Text(_statusLabel[status] ?? status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor(status))),
                ),
              ]),
              Text('@${member['username']}', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
              const SizedBox(height: 6),
              Text('${plan['name']} · ${(plan['price'] as num).toStringAsFixed(2)} ₺/${_intervalLabel[plan['interval']] ?? plan['interval']}',
                  style: const TextStyle(fontSize: 12.5, color: MettloColors.textSecondary)),
              Text('Başlangıç: ${fmtDate(s['startedAt'])}', style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary)),
              if (s['cancelledAt'] != null)
                Text('İptal: ${fmtDate(s['cancelledAt'])}', style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary)),
              if (totalPaid > 0)
                Text('Toplam ödedi: ${totalPaid.toStringAsFixed(2)} ₺', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
            ])),
          ]),
        ),
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
    Text(label, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 12)),
  ]);
}
