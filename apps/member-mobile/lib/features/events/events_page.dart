import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/tokens.dart';

// ── Providers ────────────────────────────────────────────────────────────────

final eventsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, Map<String, String?>>((ref, filters) async {
  final qs = StringBuffer('?limit=20');
  filters.forEach((k, v) { if (v != null && v.isNotEmpty) qs.write('&$k=${Uri.encodeComponent(v)}'); });
  final res = await ref.read(apiClientProvider).get('/events$qs');
  return res as Map<String, dynamic>;
});

// ── Sayfa ─────────────────────────────────────────────────────────────────────

class EventsPage extends ConsumerStatefulWidget {
  const EventsPage({super.key});
  @override
  ConsumerState<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends ConsumerState<EventsPage> {
  String? _cityId;

  String _fmtDate(String? s) {
    if (s == null) return '';
    try {
      final dt = DateTime.parse(s).toLocal();
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) { return s; }
  }

  String _fmtTL(int kurus) {
    final tl = kurus / 100;
    return '₺${tl.toStringAsFixed(tl.truncateToDouble() == tl ? 0 : 2)}';
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(eventsProvider({'cityId': _cityId}));
    return Scaffold(
      appBar: AppBar(title: const Text('Etkinlikler')),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Yüklenemedi: $e')),
        data: (d) {
          final items = (d['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return RefreshIndicator(
            onRefresh: () => ref.refresh(eventsProvider({'cityId': _cityId}).future),
            child: items.isEmpty
                ? const Center(child: Text('Henüz etkinlik yok.'))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final ev = items[i];
                      final isFree = (ev['ticketPriceKurus'] as int? ?? 0) == 0;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EventDetailPage(event: ev))),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (ev['coverImageUrl'] != null)
                                ClipRRect(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                  child: Image.network(ev['coverImageUrl']!, height: 160, width: double.infinity, fit: BoxFit.cover),
                                )
                              else
                                Container(
                                  height: 80,
                                  decoration: const BoxDecoration(
                                    color: MettloColors.primary,
                                    borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                                  ),
                                  child: const Center(child: Icon(Icons.event, color: Colors.white, size: 32)),
                                ),
                              Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(ev['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                    const SizedBox(height: 6),
                                    Row(children: [
                                      const Icon(Icons.schedule, size: 14, color: Colors.grey),
                                      const SizedBox(width: 4),
                                      Expanded(child: Text(_fmtDate(ev['startsAt']), style: const TextStyle(fontSize: 12, color: Colors.grey))),
                                    ]),
                                    if (ev['city'] != null || ev['isOnline'] == true) ...[
                                      const SizedBox(height: 4),
                                      Row(children: [
                                        const Icon(Icons.location_on, size: 14, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Text(ev['isOnline'] == true ? 'Online' : (ev['city']?['name'] ?? ev['locationName'] ?? ''), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                      ]),
                                    ],
                                    const SizedBox(height: 8),
                                    Text(
                                      isFree ? 'Ücretsiz' : _fmtTL(ev['ticketPriceKurus'] as int),
                                      style: TextStyle(fontWeight: FontWeight.bold, color: isFree ? Colors.green : MettloColors.primary),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}

// ── Etkinlik Detay ────────────────────────────────────────────────────────────

class EventDetailPage extends ConsumerStatefulWidget {
  const EventDetailPage({super.key, required this.event});
  final Map<String, dynamic> event;

  @override
  ConsumerState<EventDetailPage> createState() => _EventDetailPageState();
}

class _EventDetailPageState extends ConsumerState<EventDetailPage> {
  bool _loading = false;
  String? _error;
  bool _registered = false;

  String _fmtDate(String? s) {
    if (s == null) return '';
    try {
      final dt = DateTime.parse(s).toLocal();
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) { return s; }
  }

  Future<void> _register() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(apiClientProvider).post('/events/${widget.event['id']}/register', {});
      if (mounted) setState(() { _registered = true; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final ev = widget.event;
    final isFree = (ev['ticketPriceKurus'] as int? ?? 0) == 0;

    return Scaffold(
      appBar: AppBar(title: Text(ev['title'] ?? 'Etkinlik')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (ev['coverImageUrl'] != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(ev['coverImageUrl']!, height: 220, width: double.infinity, fit: BoxFit.cover),
              ),
            const SizedBox(height: 16),
            Text(ev['title'] ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _InfoRow(Icons.schedule, _fmtDate(ev['startsAt'])),
            if (ev['city'] != null || ev['isOnline'] == true)
              _InfoRow(Icons.location_on, ev['isOnline'] == true ? 'Online' : (ev['city']?['name'] ?? ev['locationName'] ?? '')),
            if (ev['capacityLimit'] != null) _InfoRow(Icons.people, 'Kapasite: ${ev['capacityLimit']}'),
            if (ev['organizer'] != null) _InfoRow(Icons.person, 'Organizatör: ${ev['organizer']['name'] ?? ev['organizer']['username']}'),
            const SizedBox(height: 16),
            if (ev['description'] != null) ...[
              Text(ev['description'] ?? '', style: const TextStyle(fontSize: 14, height: 1.6)),
              const SizedBox(height: 20),
            ],
            if (_error != null) Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),
            if (_registered)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(10)),
                child: const Row(children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 8),
                  Text('Kaydınız alındı!', style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600)),
                ]),
              )
            else if (isFree)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _register,
                  child: _loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Ücretsiz Kayıt Ol'),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: MettloColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                child: Text('Bilet fiyatı: ₺${((ev['ticketPriceKurus'] as int) / 100).toStringAsFixed(0)}\nÖdeme için web uygulamasını kullanın.', style: const TextStyle(fontSize: 14)),
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Colors.grey))),
        ]),
      );
}
