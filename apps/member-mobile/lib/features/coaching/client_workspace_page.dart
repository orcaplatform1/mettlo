import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';

final clientVideoSessionsProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, memberId) async {
  return await ref.watch(apiClientProvider).get('/coaching/clients/$memberId/video-sessions') as Map<String, dynamic>;
});

final clientDetailProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, memberId) async {
  return await ref.watch(apiClientProvider).get('/coaching/clients/$memberId') as Map<String, dynamic>;
});

final clientGoalsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, memberId) async {
  final res = await ref.watch(apiClientProvider).get('/coaching/clients/$memberId/goals');
  return List<Map<String, dynamic>>.from(res as List);
});

final clientMetricsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, memberId) async {
  final res = await ref.watch(apiClientProvider).get('/coaching/clients/$memberId/metrics');
  return List<Map<String, dynamic>>.from(res as List);
});

class ClientWorkspacePage extends ConsumerWidget {
  final String memberId;
  const ClientWorkspacePage({super.key, required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailState = ref.watch(clientDetailProvider(memberId));
    return detailState.when(
      loading: () => Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(appBar: AppBar(), body: Center(child: Text('Hata: $e'))),
      data: (detail) {
        final member = detail['member'] as Map<String, dynamic>;
        final checkins = List<Map<String, dynamic>>.from(detail['checkins'] as List? ?? []);
        final notes = List<Map<String, dynamic>>.from(detail['notes'] as List? ?? []);
        return DefaultTabController(
          length: 4,
          child: Scaffold(
            appBar: AppBar(
              title: Row(children: [
                CircleAvatar(backgroundImage: member['avatarUrl'] != null ? NetworkImage(member['avatarUrl'] as String) : null, child: member['avatarUrl'] == null ? Text((member['name'] as String)[0].toUpperCase()) : null, radius: 16),
                const SizedBox(width: 10),
                Text(member['name'] as String, style: const TextStyle(fontSize: 16)),
              ]),
              bottom: const TabBar(
                isScrollable: true,
                tabs: [Tab(text: 'Özet'), Tab(text: 'Hedefler'), Tab(text: 'Metrikler'), Tab(text: 'Check-in')],
              ),
            ),
            body: TabBarView(children: [
              _OverviewTab(detail: detail, notes: notes, memberId: memberId),
              _GoalsTab(memberId: memberId, ref: ref),
              _MetricsTab(memberId: memberId, ref: ref),
              _CheckinsTab(checkins: checkins, memberId: memberId),
            ]),
          ),
        );
      },
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  final Map<String, dynamic> detail;
  final List<Map<String, dynamic>> notes;
  final String memberId;
  const _OverviewTab({required this.detail, required this.notes, required this.memberId});

  String _fmtDate(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso)?.toLocal();
    return d == null ? '' : '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = detail['active'] as bool? ?? false;
    final vsState = ref.watch(clientVideoSessionsProvider(memberId));
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (!active)
          Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: MettloColors.surface2, borderRadius: BorderRadius.circular(8)), child: const Text('Pasif abonelik', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13))),
        if (detail['goal'] != null) ...[
          const SizedBox(height: 12),
          Text('Hedef: ${detail['goal']}', style: const TextStyle(fontSize: 13, color: MettloColors.textSecondary)),
        ],
        const SizedBox(height: 20),
        // 1:1 Görüntülü Koçluk Bakiyesi
        Row(children: [
          const Icon(Icons.videocam_outlined, size: 16, color: MettloColors.primary),
          const SizedBox(width: 6),
          const Text('1:1 Görüntülü Koçluk', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(width: 6),
          vsState.when(
            loading: () => const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
            error: (_, _) => const SizedBox.shrink(),
            data: (vs) {
              final total = (vs['totalRemaining'] as num?)?.toInt() ?? 0;
              return total > 0
                  ? Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: MettloColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)), child: Text('$total hak', style: const TextStyle(color: MettloColors.primary, fontSize: 11, fontWeight: FontWeight.w700)))
                  : const SizedBox.shrink();
            },
          ),
        ]),
        const SizedBox(height: 8),
        vsState.when(
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const Text('Yüklenemedi', style: TextStyle(color: MettloColors.textSecondary, fontSize: 12)),
          data: (vs) {
            final balances = (vs['balances'] as List<dynamic>?) ?? [];
            final active_ = balances.where((b) => ((b['remaining'] as num?)?.toInt() ?? 0) > 0).toList();
            if (active_.isEmpty) return const Text('Oturum hakkı yok', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13));
            return Wrap(spacing: 8, runSpacing: 8, children: active_.map((b) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(8), border: Border.all(color: MettloColors.borderSubtle)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text('${(b['remaining'] as num).toInt()} oturum', style: const TextStyle(fontWeight: FontWeight.w700, color: MettloColors.primary)),
                Text((b['pack']?['name'] as String?) ?? '', style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary)),
                Text('SKT: ${_fmtDate(b['expiresAt'] as String?)}', style: const TextStyle(fontSize: 10, color: MettloColors.textTertiary)),
              ]),
            )).toList());
          },
        ),
        const SizedBox(height: 20),
        if (notes.isNotEmpty) ...[
          const Text('Son Notlar', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 8),
          ...notes.take(3).map((n) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(10), border: Border.all(color: MettloColors.borderSubtle)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(n['category'] as String? ?? '', style: const TextStyle(fontSize: 10, color: MettloColors.textSecondary)),
              Text(n['body'] as String, style: const TextStyle(fontSize: 13)),
            ]),
          )),
        ],
      ],
    );
  }
}

class _GoalsTab extends ConsumerWidget {
  final String memberId;
  final WidgetRef ref;
  const _GoalsTab({required this.memberId, required this.ref});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(clientGoalsProvider(memberId));
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Hata: $e')),
      data: (goals) => goals.isEmpty
          ? const Center(child: Text('Henüz hedef yok', style: TextStyle(color: MettloColors.textSecondary)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: goals.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final g = goals[i];
                final pct = (double.tryParse(g['progressPct']?.toString() ?? '0') ?? 0) / 100;
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(12), border: Border.all(color: MettloColors.borderSubtle)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(g['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(value: pct.clamp(0, 1), backgroundColor: MettloColors.borderSubtle, minHeight: 4),
                    const SizedBox(height: 4),
                    Text(g['status'] as String? ?? '', style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary)),
                  ]),
                );
              },
            ),
    );
  }
}

class _MetricsTab extends ConsumerWidget {
  final String memberId;
  final WidgetRef ref;
  const _MetricsTab({required this.memberId, required this.ref});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(clientMetricsProvider(memberId));
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Hata: $e')),
      data: (metrics) => metrics.isEmpty
          ? const Center(child: Text('Henüz metrik kaydı yok', style: TextStyle(color: MettloColors.textSecondary)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: metrics.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final m = metrics[i];
                final def = m['metric'] as Map<String, dynamic>? ?? {};
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(10), border: Border.all(color: MettloColors.borderSubtle)),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(def['name'] as String? ?? m['metricId'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      Text(def['category'] as String? ?? '', style: const TextStyle(fontSize: 10, color: MettloColors.textSecondary)),
                    ])),
                    Text('${m['value']} ${m['unit']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  ]),
                );
              },
            ),
    );
  }
}

class _CheckinsTab extends ConsumerStatefulWidget {
  final List<Map<String, dynamic>> checkins;
  final String memberId;
  const _CheckinsTab({required this.checkins, required this.memberId});

  @override
  ConsumerState<_CheckinsTab> createState() => _CheckinsTabState();
}

class _CheckinsTabState extends ConsumerState<_CheckinsTab> {
  String? _expandedId;
  final Map<String, String> _replies = {};

  Future<void> _sendReply(String checkinId) async {
    final reply = _replies[checkinId];
    if (reply == null || reply.isEmpty) return;
    await ref.read(apiClientProvider).patch('/coaching/clients/${widget.memberId}/checkins/$checkinId', body: {'coachReply': reply, 'status': 'REVIEWED'});
    if (mounted) setState(() => _expandedId = null);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.checkins.isEmpty) return const Center(child: Text('Henüz check-in yok', style: TextStyle(color: MettloColors.textSecondary)));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: widget.checkins.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final c = widget.checkins[i];
        final id = c['id'] as String;
        final isOpen = _expandedId == id;
        return Container(
          decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(12), border: Border.all(color: MettloColors.borderSubtle)),
          child: Column(children: [
            InkWell(
              onTap: () => setState(() => _expandedId = isOpen ? null : id),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(children: [
                  Text(c['period'] as String? ?? (c['createdAt'] as String).substring(0, 10), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text(c['status'] as String, style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary)),
                  const SizedBox(width: 6),
                  Icon(isOpen ? Icons.expand_less : Icons.expand_more, size: 18, color: MettloColors.textSecondary),
                ]),
              ),
            ),
            if (isOpen)
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  if (c['energyScore'] != null) _ScoreRow(label: 'Enerji', value: c['energyScore'] as int),
                  if (c['moodScore'] != null) _ScoreRow(label: 'Ruh hali', value: c['moodScore'] as int),
                  if (c['highlights'] != null) Text('İyi gidenler: ${c['highlights']}', style: const TextStyle(fontSize: 12)),
                  if (c['challenges'] != null) Text('Zorluklar: ${c['challenges']}', style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 10),
                  TextField(
                    decoration: const InputDecoration(hintText: 'Koç yanıtı yaz…', border: OutlineInputBorder(), isDense: true),
                    maxLines: 3,
                    onChanged: (v) => _replies[id] = v,
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(onPressed: () => _sendReply(id), child: const Text('Yanıtla')),
                ]),
              ),
          ]),
        );
      },
    );
  }
}

class _ScoreRow extends StatelessWidget {
  final String label;
  final int value;
  const _ScoreRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(children: [
        SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 12, color: MettloColors.textSecondary))),
        Expanded(child: LinearProgressIndicator(value: value / 10, backgroundColor: MettloColors.borderSubtle, minHeight: 5, color: value >= 7 ? Colors.green : value >= 4 ? Colors.orange : Colors.red)),
        const SizedBox(width: 6),
        Text('$value', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
