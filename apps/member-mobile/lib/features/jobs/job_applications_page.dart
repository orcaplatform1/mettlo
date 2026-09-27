import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final _myApplicationsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/my-job-applications');
  return (res as List?) ?? [];
});

final _myOffersProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  try {
    final res = await ref.watch(apiClientProvider).get('/my-job-applications/offers');
    return (res as List?) ?? [];
  } catch (_) { return []; }
});

const _statusTr = {
  'APPLIED': 'Başvuruldu',
  'VIEWED': 'Görüntülendi',
  'SHORTLISTED': 'Kısa Listede',
  'REJECTED': 'Reddedildi',
  'HIRED': 'Kabul Edildi',
};

Color _statusColor(String status) {
  switch (status) {
    case 'SHORTLISTED':
    case 'HIRED': return const Color(0xFF22c55e);
    case 'REJECTED': return const Color(0xFFef4444);
    case 'VIEWED': return const Color(0xFF3b82f6);
    default: return MettloColors.textTertiary;
  }
}

class JobApplicationsPage extends ConsumerWidget {
  const JobApplicationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apps = ref.watch(_myApplicationsProvider);
    final offers = ref.watch(_myOffersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('İş Başvurularım')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async {
          ref.invalidate(_myApplicationsProvider);
          ref.invalidate(_myOffersProvider);
        },
        child: apps.when(
          loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
          error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Başvurular yüklenemedi.', error: true))),
          data: (appList) {
            final offerList = offers.value ?? [];

            if (appList.isEmpty && offerList.isEmpty) {
              return const Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.work_off_outlined, size: 52, color: MettloColors.textMuted),
                  SizedBox(height: 16),
                  Text('Henüz başvuru yok', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                  SizedBox(height: 8),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 40),
                    child: Text('İş ilanlarına göz atarak başvurabilirsin.', style: TextStyle(color: MettloColors.textSecondary, height: 1.5), textAlign: TextAlign.center),
                  ),
                ]),
              );
            }

            return ListView(padding: const EdgeInsets.all(16), children: [
              if (offerList.isNotEmpty) ...[
                const SectionTitle('Gelen Teklifler'),
                ...offerList.map((o) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _OfferCard(o as Map<String, dynamic>))),
                const SizedBox(height: 8),
              ],
              const SectionTitle('Başvurularım'),
              if (appList.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: Text('Henüz başvuru yok.', style: TextStyle(color: MettloColors.textSecondary))),
                )
              else
                ...appList.map((a) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _ApplicationCard(a as Map<String, dynamic>))),
            ]);
          },
        ),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard(this.app);
  final Map<String, dynamic> app;

  @override
  Widget build(BuildContext context) {
    final job = app['job'] as Map<String, dynamic>? ?? {};
    final title = job['title'] as String? ?? '';
    final businessName = (job['business'] as Map?)?['name'] as String? ?? '';
    final status = app['status'] as String? ?? 'APPLIED';
    final statusLabel = _statusTr[status] ?? status;
    final color = _statusColor(status);
    final appliedAt = DateTime.tryParse(app['appliedAt'] as String? ?? app['createdAt'] as String? ?? '')?.toLocal();
    final dateFmt = appliedAt != null ? '${appliedAt.day.toString().padLeft(2, '0')}.${appliedAt.month.toString().padLeft(2, '0')}.${appliedAt.year}' : '';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: MettloColors.surface1,
        borderRadius: BorderRadius.circular(MettloRadius.card),
        border: Border.all(color: MettloColors.borderSubtle),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          if (businessName.isNotEmpty) ...[
            const SizedBox(height: 3),
            Text(businessName, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
          ],
          if (dateFmt.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(dateFmt, style: const TextStyle(color: MettloColors.textMuted, fontSize: 12)),
          ],
        ])),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: color.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(MettloRadius.pill),
          ),
          child: Text(statusLabel, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard(this.offer);
  final Map<String, dynamic> offer;

  @override
  Widget build(BuildContext context) {
    final job = offer['job'] as Map<String, dynamic>? ?? {};
    final title = job['title'] as String? ?? '';
    final businessName = (job['business'] as Map?)?['name'] as String? ?? '';
    final message = offer['message'] as String?;
    final createdAt = DateTime.tryParse(offer['createdAt'] as String? ?? '')?.toLocal();
    final dateFmt = createdAt != null ? '${createdAt.day.toString().padLeft(2, '0')}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}' : '';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: const Color(0xFF22c55e).withValues(alpha: .06),
        borderRadius: BorderRadius.circular(MettloRadius.card),
        border: Border.all(color: const Color(0xFF22c55e).withValues(alpha: .4)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.celebration_outlined, size: 18, color: Color(0xFF22c55e)),
          const SizedBox(width: 8),
          Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
        ]),
        if (businessName.isNotEmpty) ...[
          const SizedBox(height: 3),
          Text(businessName, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
        ],
        if (message != null && message.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(message, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5, height: 1.4)),
        ],
        if (dateFmt.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(dateFmt, style: const TextStyle(color: MettloColors.textMuted, fontSize: 12)),
        ],
      ]),
    );
  }
}
