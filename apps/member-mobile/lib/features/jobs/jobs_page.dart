import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/tokens.dart';

// ── Providers ────────────────────────────────────────────────────────────────

final jobsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, Map<String, String?>>((ref, filters) async {
  final qs = StringBuffer('?');
  var first = true;
  filters.forEach((k, v) {
    if (v != null && v.isNotEmpty) {
      if (!first) qs.write('&');
      qs.write('$k=${Uri.encodeComponent(v)}');
      first = false;
    }
  });
  final res = await ref.read(apiClientProvider).get('/jobs$qs');
  return res as Map<String, dynamic>;
});

const _workModes = {
  'ONLINE': 'Online',
  'BUSINESS': 'İşletmede',
  'HYBRID': 'Hibrit',
  'OUTDOOR': 'Açık Hava',
};

// ── Sayfa ─────────────────────────────────────────────────────────────────────

class JobsPage extends ConsumerStatefulWidget {
  const JobsPage({super.key});
  @override
  ConsumerState<JobsPage> createState() => _JobsPageState();
}

class _JobsPageState extends ConsumerState<JobsPage> {
  String? _workMode;

  String _fmtDate(String? s) {
    if (s == null) return '';
    try {
      final dt = DateTime.parse(s).toLocal();
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) { return s; }
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(jobsProvider({'workMode': _workMode}));
    return Scaffold(
      appBar: AppBar(title: const Text('Koç İş İlanları')),
      body: Column(
        children: [
          // Çalışma şekli filtresi
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
            child: Row(
              children: [
                _FilterChip(label: 'Tümü', active: _workMode == null, onTap: () => setState(() => _workMode = null)),
                ..._workModes.entries.map((e) => _FilterChip(
                  label: e.value,
                  active: _workMode == e.key,
                  onTap: () => setState(() => _workMode = e.key),
                )),
              ],
            ),
          ),
          Expanded(
            child: data.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Yüklenemedi: $e')),
              data: (d) {
                final items = (d['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
                if (items.isEmpty) return const Center(child: Text('İlan bulunamadı.'));
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(jobsProvider({'workMode': _workMode}).future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final job = items[i];
                      final branches = (job['branchSlugs'] as List?)?.cast<String>() ?? [];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => JobDetailPage(job: job))),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(child: Text(job['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15))),
                                    Text(_fmtDate(job['createdAt']), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(job['business']?['name'] ?? '—', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                                if (job['city'] != null) ...[
                                  const SizedBox(height: 2),
                                  Row(children: [
                                    const Icon(Icons.location_on, size: 12, color: Colors.grey),
                                    const SizedBox(width: 3),
                                    Text(job['city']['name'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.work, size: 12, color: Colors.grey),
                                    const SizedBox(width: 3),
                                    Text(_workModes[job['workMode']] ?? job['workMode'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  ]),
                                ],
                                if (branches.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Wrap(spacing: 4, runSpacing: 4, children: branches.take(3).map((b) => Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: MettloColors.primary.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(b, style: const TextStyle(fontSize: 11)),
                                  )).toList()),
                                ],
                                const SizedBox(height: 6),
                                Text('${(job['_count']?['applications'] ?? 0)} başvuru', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── İlan Detay ────────────────────────────────────────────────────────────────

class JobDetailPage extends ConsumerStatefulWidget {
  const JobDetailPage({super.key, required this.job});
  final Map<String, dynamic> job;

  @override
  ConsumerState<JobDetailPage> createState() => _JobDetailPageState();
}

class _JobDetailPageState extends ConsumerState<JobDetailPage> {
  final _coverLetterCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _applied = false;

  @override
  void dispose() {
    _coverLetterCtrl.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(apiClientProvider).post(
        '/my-job-applications/${widget.job['id']}',
        { if (_coverLetterCtrl.text.trim().isNotEmpty) 'coverLetter': _coverLetterCtrl.text.trim() },
      );
      if (mounted) setState(() { _applied = true; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final job = widget.job;
    return Scaffold(
      appBar: AppBar(title: Text(job['title'] ?? 'İş İlanı')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(job['title'] ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(job['business']?['name'] ?? '', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 12),
            if (job['city'] != null || job['workMode'] != null)
              Wrap(spacing: 12, children: [
                if (job['city'] != null) Chip(label: Text(job['city']['name']), avatar: const Icon(Icons.location_on, size: 14), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap),
                if (job['workMode'] != null) Chip(label: Text(_workModes[job['workMode']] ?? job['workMode']), avatar: const Icon(Icons.work, size: 14), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap),
              ]),
            const SizedBox(height: 12),
            if (job['description'] != null) ...[
              const Text('Açıklama', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Text(job['description'], style: const TextStyle(fontSize: 14, height: 1.6)),
              const SizedBox(height: 12),
            ],
            if (job['requirements'] != null) ...[
              const Text('Gereksinimler', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Text(job['requirements'], style: const TextStyle(fontSize: 14, height: 1.6)),
              const SizedBox(height: 16),
            ],
            const Divider(),
            const SizedBox(height: 12),
            if (_applied)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(10)),
                child: const Row(children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 8),
                  Text('Başvurunuz gönderildi!', style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600)),
                ]),
              )
            else ...[
              const Text('Başvuru', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              const SizedBox(height: 8),
              TextField(
                controller: _coverLetterCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Ön yazınızı buraya yazın (isteğe bağlı)…',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              if (_error != null) Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _apply,
                  child: _loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Başvur'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: active ? MettloColors.primary : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(fontSize: 12, color: active ? Colors.white : Colors.black87, fontWeight: active ? FontWeight.w600 : FontWeight.normal)),
        ),
      );
}
