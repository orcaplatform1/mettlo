import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final reportsProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, status) async =>
        await ref.watch(apiClientProvider).get('/admin/user-reports?status=$status&limit=50')
            as Map<String, dynamic>);

const _statusTr = {
  'OPEN': 'Açık',
  'REVIEWING': 'İnceleniyor',
  'RESOLVED': 'Çözüldü',
  'DISMISSED': 'Reddedildi',
};
const _typeTr = {
  'message': 'Mesaj',
  'review': 'Yorum',
  'user': 'Kullanıcı',
};

class ModerationPage extends ConsumerStatefulWidget {
  const ModerationPage({super.key});
  @override
  ConsumerState<ModerationPage> createState() => _ModerationPageState();
}

class _ModerationPageState extends ConsumerState<ModerationPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _statusKeys = _statusTr.keys.toList();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _statusKeys.length, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Şikayet Yönetimi'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: [for (final s in _statusTr.values) Tab(text: s)],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [for (final status in _statusKeys) _ReportList(status: status)],
      ),
    );
  }
}

class _ReportList extends ConsumerWidget {
  const _ReportList({required this.status});
  final String status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(reportsProvider(status));
    return RefreshIndicator(
      color: MettloColors.primary,
      onRefresh: () async => ref.invalidate(reportsProvider(status)),
      child: AsyncBody(
        value: data,
        onRetry: () => ref.invalidate(reportsProvider(status)),
        builder: (d) {
          final items = (d['items'] as List?) ?? [];
          return items.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: InfoBanner('Bu kategoride şikayet yok.'),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (_, i) {
                    final r = items[i] as Map<String, dynamic>;
                    final reporter = r['reporter'] as Map<String, dynamic>? ?? {};
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Chip(
                              label: Text(
                                _typeTr[r['targetType']] ?? r['targetType'] as String,
                                style: const TextStyle(fontSize: 11),
                              ),
                              padding: EdgeInsets.zero,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              DateTime.parse(r['createdAt'] as String)
                                  .toLocal()
                                  .toString()
                                  .substring(0, 10),
                              style: const TextStyle(
                                  fontSize: 11, color: MettloColors.textTertiary),
                            ),
                          ]),
                          const SizedBox(height: 6),
                          RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                  color: MettloColors.textPrimary, fontSize: 13),
                              children: [
                                const TextSpan(
                                  text: 'Şikayet eden: ',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                                TextSpan(
                                  text:
                                      '@${reporter['username']} (${reporter['role']})',
                                  style:
                                      const TextStyle(color: MettloColors.primary),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text('Neden: ${r['reason']}',
                              style: const TextStyle(fontWeight: FontWeight.w500)),
                          if (r['body'] != null)
                            Text(r['body'] as String,
                                style: const TextStyle(
                                    color: MettloColors.textSecondary, fontSize: 13)),
                          const SizedBox(height: 10),
                          Wrap(spacing: 6, children: [
                            if (status == 'OPEN')
                              _ActionBtn(
                                  id: r['id'] as String,
                                  newStatus: 'REVIEWING',
                                  label: 'İncelemeye Al',
                                  curStatus: status),
                            if (status != 'RESOLVED')
                              _ActionBtn(
                                  id: r['id'] as String,
                                  newStatus: 'RESOLVED',
                                  label: 'Çözüldü',
                                  curStatus: status),
                            if (status != 'DISMISSED')
                              _ActionBtn(
                                  id: r['id'] as String,
                                  newStatus: 'DISMISSED',
                                  label: 'Reddet',
                                  curStatus: status,
                                  danger: true),
                          ]),
                        ]),
                      ),
                    );
                  },
                );
        },
      ),
    );
  }
}

class _ActionBtn extends ConsumerStatefulWidget {
  const _ActionBtn({
    required this.id,
    required this.newStatus,
    required this.label,
    required this.curStatus,
    this.danger = false,
  });
  final String id;
  final String newStatus;
  final String label;
  final String curStatus;
  final bool danger;

  @override
  ConsumerState<_ActionBtn> createState() => _ActionBtnState();
}

class _ActionBtnState extends ConsumerState<_ActionBtn> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      style: FilledButton.styleFrom(
        backgroundColor: widget.danger ? MettloColors.error : MettloColors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        textStyle: const TextStyle(fontSize: 12),
      ),
      onPressed: _busy
          ? null
          : () async {
              setState(() => _busy = true);
              try {
                await ref.read(apiClientProvider).patch(
                    '/admin/user-reports/${widget.id}',
                    body: {'status': widget.newStatus});
                ref.invalidate(reportsProvider(widget.curStatus));
              } on ApiException catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context)
                      .showSnackBar(SnackBar(content: Text(e.message)));
                }
              } finally {
                if (mounted) setState(() => _busy = false);
              }
            },
      child: _busy
          ? const SizedBox.square(
              dimension: 14,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : Text(widget.label),
    );
  }
}
