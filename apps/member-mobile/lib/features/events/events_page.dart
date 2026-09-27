import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

// ── Providers ────────────────────────────────────────────────────────────────

final eventsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, Map<String, String?>>((ref, filters) async {
  final qs = StringBuffer('?limit=20');
  filters.forEach((k, v) { if (v != null && v.isNotEmpty) qs.write('&$k=${Uri.encodeComponent(v)}'); });
  final res = await ref.read(apiClientProvider).get('/events$qs', auth: false);
  return res as Map<String, dynamic>;
});

final citiesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.read(apiClientProvider).get('/public/cities', auth: false) as List<dynamic>);

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
    final cities = ref.watch(citiesProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async {
          ref.invalidate(eventsProvider({'cityId': _cityId}));
          ref.invalidate(citiesProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Hero başlık
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 52, 20, 20),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D0B1F),
                  gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [const Color(0xFF0D0B1F), MettloColors.primary.withValues(alpha: .15)]),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('ETKİNLİKLER', style: TextStyle(color: MettloColors.primary, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                  const SizedBox(height: 8),
                  Text('Spor etkinlikleri', style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 28)),
                  const SizedBox(height: 8),
                  const Text('Fitness, yoga, boks ve daha fazlası — online ve yüz yüze etkinliklere katıl.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 14, height: 1.5)),
                ]),
              ),
            ),
            // Şehir filtreleri
            SliverToBoxAdapter(
              child: cities.maybeWhen(
                data: (cs) => cs.isEmpty ? const SizedBox.shrink() : SizedBox(
                  height: 48,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    children: [
                      _CityChip(label: 'Tüm Şehirler', active: _cityId == null, onTap: () => setState(() => _cityId = null)),
                      for (final c in cs.take(12))
                        _CityChip(label: c['name'] as String, active: _cityId == '${c['id']}', onTap: () => setState(() => _cityId = '${c['id']}')),
                    ],
                  ),
                ),
                orElse: () => const SizedBox.shrink(),
              ),
            ),
            // Liste
            data.when(
              loading: () => const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: MettloColors.primary)))),
              error: (e, _) => SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: InfoBanner('Yüklenemedi. Tekrar dene.', error: true))),
              data: (d) {
                final items = (d['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
                if (items.isEmpty) {
                  return const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(24), child: Center(child: Text('Henüz etkinlik yok.', style: TextStyle(color: MettloColors.textSecondary)))));
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  sliver: SliverList.builder(
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final ev = items[i];
                      final isFree = (ev['ticketPriceKurus'] as int? ?? 0) == 0;
                      final org = ev['organizer'] as Map<String, dynamic>?;
                      final biz = ev['business'] as Map<String, dynamic>?;
                      final displayName = biz?['name'] ?? org?['name'] ?? '';
                      final displayHandle = biz?['slug'] ?? org?['username'] ?? '';
                      final displayAvatar = biz?['logoUrl'] ?? org?['avatarUrl'];
                      final isVerified = biz != null
                          ? biz['verificationStatus'] == 'VERIFIED'
                          : org?['creatorProfile']?['verified'] == true;
                      final locationParts = [
                        if (ev['isOnline'] == true) 'Online',
                        if (ev['locationName'] != null) ev['locationName'] as String,
                        if (ev['city'] != null) (ev['city'] as Map)['name'] as String,
                      ].toSet().toList();
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
                                  child: CachedNetworkImage(imageUrl: imgUrl(ev['coverImageUrl'] as String), height: 160, width: double.infinity, fit: BoxFit.cover, errorWidget: (_, _, _) => const SizedBox.shrink()),
                                )
                              else
                                Container(
                                  height: 72,
                                  decoration: const BoxDecoration(
                                    color: MettloColors.primary,
                                    borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                                  ),
                                  child: const Center(child: Icon(Icons.event, color: Colors.white, size: 28)),
                                ),
                              Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Organizatör / işletme satırı
                                    Row(children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(7),
                                        child: displayAvatar != null
                                            ? CachedNetworkImage(imageUrl: imgUrl(displayAvatar as String), width: 30, height: 30, fit: BoxFit.cover, errorWidget: (_, _, _) => const SizedBox.shrink())
                                            : Container(width: 30, height: 30, color: MettloColors.surface2, child: const Icon(Icons.person, size: 16, color: MettloColors.textSecondary)),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        Row(children: [
                                          Flexible(child: Text(displayName, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                                          if (isVerified) ...[const SizedBox(width: 3), Icon(Icons.verified, size: 13, color: MettloColors.verified)],
                                        ]),
                                        Text('@$displayHandle', style: const TextStyle(fontSize: 11, color: MettloColors.textTertiary)),
                                      ])),
                                    ]),
                                    const SizedBox(height: 10),
                                    // Tarih
                                    Row(children: [
                                      const Icon(Icons.schedule, size: 13, color: Colors.grey),
                                      const SizedBox(width: 4),
                                      Expanded(child: Text(_fmtDate(ev['startsAt']), style: const TextStyle(fontSize: 11.5, color: Colors.grey))),
                                    ]),
                                    if (locationParts.isNotEmpty) ...[
                                      const SizedBox(height: 3),
                                      Row(children: [
                                        const Icon(Icons.location_on, size: 13, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Expanded(child: Text(locationParts.join(', '), style: const TextStyle(fontSize: 11.5, color: Colors.grey), overflow: TextOverflow.ellipsis)),
                                      ]),
                                    ],
                                    const SizedBox(height: 8),
                                    Text(ev['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                    const SizedBox(height: 8),
                                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                      Text(
                                        isFree ? 'Ücretsiz' : _fmtTL(ev['ticketPriceKurus'] as int),
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isFree ? Colors.green : MettloColors.primary),
                                      ),
                                      TextButton(
                                        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EventDetailPage(event: ev))),
                                        style: TextButton.styleFrom(
                                          backgroundColor: MettloColors.primary,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                        ),
                                        child: const Text('Etkinliğe Katıl', style: TextStyle(fontSize: 12)),
                                      ),
                                    ]),
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
          ],
        ),
      ),
    );
  }
}

class _CityChip extends StatelessWidget {
  const _CityChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        color: active ? MettloColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: active ? MettloColors.primary : MettloColors.borderSubtle),
      ),
      child: Text(label, style: TextStyle(fontSize: 12.5, color: active ? Colors.white : MettloColors.textSecondary, fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
    ),
  );
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
      await ref.read(apiClientProvider).post('/events/${widget.event['id']}/register', body: {});
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
                child: Image.network(imgUrl(ev['coverImageUrl'] as String?), height: 220, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox.shrink()),
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
