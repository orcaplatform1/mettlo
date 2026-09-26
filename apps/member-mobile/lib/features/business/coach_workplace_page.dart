import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';

final coachWorkplacesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/coach/workplaces') as List<dynamic>);

final _directorySearchProvider = FutureProvider.autoDispose.family<List<dynamic>, String>((ref, q) async {
  if (q.isEmpty) return [];
  return await ref.watch(apiClientProvider).get('/business/directory/search', query: {'q': q}, auth: false) as List<dynamic>;
});

class CoachWorkplacePage extends ConsumerWidget {
  const CoachWorkplacePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workplacesAsync = ref.watch(coachWorkplacesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Çalıştığım Yerler'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Ekle',
            onPressed: () => _showAddSheet(context, ref),
          ),
        ],
      ),
      body: workplacesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Hata: $e')),
        data: (list) {
          if (list.isEmpty) {
            return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.storefront_outlined, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              const Text('Henüz çalıştığınız bir yer eklenmemiş', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 20),
              FilledButton.icon(
                icon: const Icon(Icons.add),
                label: const Text('Yer Ekle'),
                onPressed: () => _showAddSheet(context, ref),
              ),
            ]));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _WorkplaceTile(
              workplace: list[i] as Map<String, dynamic>,
              onEnd: () async {
                await ref.read(apiClientProvider).patch('/coach/workplaces/${list[i]['id']}/end');
                ref.invalidate(coachWorkplacesProvider);
              },
              onDelete: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Sil'),
                    content: const Text('Bu çalışma kaydını silmek istiyor musunuz?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal')),
                      TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sil', style: TextStyle(color: Colors.red))),
                    ],
                  ),
                );
                if (confirmed == true) {
                  await ref.read(apiClientProvider).delete('/coach/workplaces/${list[i]['id']}');
                  ref.invalidate(coachWorkplacesProvider);
                }
              },
            ),
          );
        },
      ),
    );
  }
}

class _WorkplaceTile extends StatelessWidget {
  const _WorkplaceTile({required this.workplace, required this.onEnd, required this.onDelete});
  final Map<String, dynamic> workplace;
  final VoidCallback onEnd;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final entry = workplace['directoryEntry'] as Map<String, dynamic>?;
    final isActive = workplace['status'] == 'ACTIVE';
    final startedAt = workplace['startedAt'] != null
        ? DateFormat('MMM yyyy', 'tr_TR').format(DateTime.parse(workplace['startedAt'] as String))
        : null;
    final endedAt = workplace['endedAt'] != null
        ? DateFormat('MMM yyyy', 'tr_TR').format(DateTime.parse(workplace['endedAt'] as String))
        : null;

    final name = (workplace['customName'] as String?) ?? (entry?['name'] as String?) ?? 'Bilinmeyen İşletme';

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isActive ? MettloColors.primary.withOpacity(.3) : Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Flexible(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isActive ? MettloColors.primary.withOpacity(.1) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(isActive ? 'Aktif' : 'Geçmiş', style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700,
                color: isActive ? MettloColors.primary : Colors.grey.shade500,
              )),
            ),
          ]),
          if (workplace['role'] != null) ...[
            const SizedBox(height: 4),
            Text(workplace['role'] as String, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          ],
          if (startedAt != null) ...[
            const SizedBox(height: 4),
            Text(
              endedAt != null ? '$startedAt – $endedAt' : '$startedAt\'dan beri',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
            ),
          ],
        ])),
        PopupMenuButton<String>(
          onSelected: (v) { if (v == 'end') onEnd(); else if (v == 'delete') onDelete(); },
          itemBuilder: (_) => [
            if (isActive) const PopupMenuItem(value: 'end', child: Text('Çalışmayı Sonlandır')),
            const PopupMenuItem(value: 'delete', child: Text('Sil', style: TextStyle(color: Colors.red))),
          ],
        ),
      ]),
    );
  }
}

void _showAddSheet(BuildContext context, WidgetRef ref) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => _AddWorkplaceSheet(ref: ref),
  );
}

class _AddWorkplaceSheet extends ConsumerStatefulWidget {
  const _AddWorkplaceSheet({required this.ref});
  final WidgetRef ref;

  @override
  ConsumerState<_AddWorkplaceSheet> createState() => _AddWorkplaceSheetState();
}

class _AddWorkplaceSheetState extends ConsumerState<_AddWorkplaceSheet> {
  final _searchCtrl = TextEditingController();
  final _customNameCtrl = TextEditingController();
  final _roleCtrl = TextEditingController();
  String _searchQuery = '';
  String? _selectedEntryId;
  String? _selectedEntryName;
  bool _useCustom = false;
  bool _busy = false;

  Future<void> _submit() async {
    if (!_useCustom && _selectedEntryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Bir işletme seçin.')));
      return;
    }
    if (_useCustom && _customNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('İşletme adını girin.')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/coach/workplaces', body: {
        if (_useCustom) 'customName': _customNameCtrl.text.trim() else 'directoryEntryId': _selectedEntryId,
        if (_roleCtrl.text.trim().isNotEmpty) 'role': _roleCtrl.text.trim(),
      });
      ref.invalidate(coachWorkplacesProvider);
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchResults = ref.watch(_directorySearchProvider(_searchQuery));

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 20, 16, MediaQuery.viewInsetsOf(context).bottom + 20),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Çalıştığınız Yeri Ekleyin', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        const SizedBox(height: 16),

        // Dizinde ara veya elle gir
        Row(children: [
          Expanded(child: ChoiceChip(label: const Text('Dizinde Ara'), selected: !_useCustom, onSelected: (_) => setState(() => _useCustom = false))),
          const SizedBox(width: 8),
          Expanded(child: ChoiceChip(label: const Text('Elle Gir'), selected: _useCustom, onSelected: (_) => setState(() => _useCustom = true))),
        ]),
        const SizedBox(height: 14),

        if (!_useCustom) ...[
          TextField(
            controller: _searchCtrl,
            decoration: const InputDecoration(hintText: 'İşletme adı ile ara...', prefixIcon: Icon(Icons.search, size: 20), isDense: true),
            onChanged: (v) => setState(() { _searchQuery = v.trim(); _selectedEntryId = null; _selectedEntryName = null; }),
          ),
          const SizedBox(height: 8),
          if (_selectedEntryName != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(color: MettloColors.primary.withOpacity(.1), borderRadius: BorderRadius.circular(8)),
              child: Row(children: [
                const Icon(Icons.check_circle, size: 16, color: MettloColors.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(_selectedEntryName!, style: const TextStyle(fontWeight: FontWeight.w600, color: MettloColors.primary))),
                IconButton(icon: const Icon(Icons.close, size: 16), onPressed: () => setState(() { _selectedEntryId = null; _selectedEntryName = null; })),
              ]),
            )
          else
            searchResults.when(
              loading: () => const Center(child: SizedBox.square(dimension: 24, child: CircularProgressIndicator(strokeWidth: 2))),
              error: (_, __) => const SizedBox.shrink(),
              data: (list) => Column(
                children: list.take(5).map((e) => ListTile(
                  dense: true,
                  title: Text(e['name'] as String),
                  subtitle: Text((e['city'] as Map<String, dynamic>?)?['name'] as String? ?? ''),
                  onTap: () => setState(() { _selectedEntryId = e['id'] as String; _selectedEntryName = e['name'] as String; _searchCtrl.clear(); _searchQuery = ''; }),
                )).toList(),
              ),
            ),
        ] else ...[
          TextField(
            controller: _customNameCtrl,
            decoration: const InputDecoration(hintText: 'İşletme adı', isDense: true),
          ),
        ],

        const SizedBox(height: 12),
        TextField(
          controller: _roleCtrl,
          decoration: const InputDecoration(hintText: 'Pozisyonunuz (isteğe bağlı, ör: Pilates Koçu)', isDense: true),
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _busy ? null : _submit,
          style: FilledButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
          child: _busy
              ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Ekle'),
        ),
      ]),
    );
  }
}
