import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/tokens.dart';

final myEventTicketsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ref.read(apiClientProvider).get('/me/event-tickets');
  return res as Map<String, dynamic>;
});

class MyEventsPage extends ConsumerWidget {
  const MyEventsPage({super.key});

  String _fmt(String? s) {
    if (s == null) return '';
    try {
      final dt = DateTime.parse(s).toLocal();
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) { return s; }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(myEventTicketsProvider);
    final now = DateTime.now();

    return Scaffold(
      appBar: AppBar(title: const Text('Etkinliklerim')),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Yüklenemedi: $e')),
        data: (d) {
          final tickets       = (d['tickets']       as List?)?.cast<Map<String, dynamic>>() ?? [];
          final registrations = (d['registrations'] as List?)?.cast<Map<String, dynamic>>() ?? [];

          final all = [
            ...tickets.map((t) => {'item': t, 'paid': true}),
            ...registrations.map((r) => {'item': r, 'paid': false}),
          ]..sort((a, b) {
            final aStart = (a['item'] as Map)['event']?['startsAt'] as String? ?? '';
            final bStart = (b['item'] as Map)['event']?['startsAt'] as String? ?? '';
            return aStart.compareTo(bStart);
          });

          if (all.isEmpty) {
            return Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.confirmation_number_outlined, size: 48, color: MettloColors.textSecondary.withOpacity(0.4)),
                const SizedBox(height: 12),
                Text('Henüz katıldığın bir etkinlik yok.', style: TextStyle(color: MettloColors.textSecondary)),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: () => context.push('/events'), child: const Text('Etkinlikleri Keşfet')),
              ]),
            );
          }

          final upcoming = all.where((e) {
            final start = ((e['item'] as Map)['event']?['startsAt'] as String?) ?? '';
            return start.isNotEmpty && DateTime.tryParse(start)?.isAfter(now) == true;
          }).toList();

          final past = all.where((e) {
            final start = ((e['item'] as Map)['event']?['startsAt'] as String?) ?? '';
            return start.isEmpty || DateTime.tryParse(start)?.isBefore(now) == true;
          }).toList();

          return RefreshIndicator(
            onRefresh: () => ref.refresh(myEventTicketsProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(14),
              children: [
                if (upcoming.isNotEmpty) ...[
                  _SectionHeader(label: 'Yaklaşan', count: upcoming.length),
                  ...upcoming.map((e) => _EventCard(entry: e, fmt: _fmt)),
                  const SizedBox(height: 12),
                ],
                if (past.isNotEmpty) ...[
                  _SectionHeader(label: 'Geçmiş', count: past.length),
                  ...past.map((e) => _EventCard(entry: e, fmt: _fmt, muted: true)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label, required this.count});
  final String label;
  final int count;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8, top: 4),
    child: Text(
      '$label ($count)',
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.1, color: MettloColors.textSecondary, textBaseline: TextBaseline.alphabetic),
    ),
  );
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.entry, required this.fmt, this.muted = false});
  final Map<String, dynamic> entry;
  final String Function(String?) fmt;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final item      = entry['item']  as Map<String, dynamic>;
    final isPaid    = entry['paid']  as bool;
    final event     = item['event'] as Map<String, dynamic>? ?? item;
    final organizer = event['organizer'] as Map<String, dynamic>?;
    final city      = event['city']?['name'] as String?;
    final location  = (event['isOnline'] == true) ? 'Online' : [event['locationName'], city].where((e) => e != null && (e as String).isNotEmpty).join(', ');

    return Opacity(
      opacity: muted ? 0.6 : 1,
      child: Card(
        margin: const EdgeInsets.only(bottom: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: GestureDetector(
                  onTap: () { if (event['slug'] != null) context.push('/event/${event['slug']}'); },
                  child: Text(event['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isPaid ? MettloColors.primary.withOpacity(0.12) : MettloColors.success.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  isPaid ? 'Biletli' : 'Ücretsiz',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isPaid ? MettloColors.primary : MettloColors.success),
                ),
              ),
            ]),
            const SizedBox(height: 6),
            Row(children: [
              Icon(Icons.access_time, size: 13, color: MettloColors.textSecondary),
              const SizedBox(width: 4),
              Expanded(child: Text(fmt(event['startsAt'] as String?), style: TextStyle(fontSize: 12, color: MettloColors.textSecondary))),
            ]),
            if (location.isNotEmpty) ...[
              const SizedBox(height: 3),
              Row(children: [
                Icon(Icons.location_on_outlined, size: 13, color: MettloColors.textSecondary),
                const SizedBox(width: 4),
                Expanded(child: Text(location, style: TextStyle(fontSize: 12, color: MettloColors.textSecondary))),
              ]),
            ],
            if (organizer != null) ...[
              const SizedBox(height: 10),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                GestureDetector(
                  onTap: () { if (organizer['username'] != null) context.push('/profile/${organizer['username']}'); },
                  child: Row(children: [
                    if (organizer['avatarUrl'] != null)
                      CircleAvatar(backgroundImage: NetworkImage(organizer['avatarUrl']), radius: 12)
                    else
                      CircleAvatar(backgroundColor: MettloColors.primary, radius: 12, child: Text((organizer['name'] ?? organizer['username'] ?? '?')[0].toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold))),
                    const SizedBox(width: 6),
                    Text(organizer['name'] ?? organizer['username'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ]),
                ),
                TextButton.icon(
                  onPressed: () => context.push('/messages?to=${organizer['username']}'),
                  icon: const Icon(Icons.message_outlined, size: 14),
                  label: const Text('Yaz', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    foregroundColor: MettloColors.primary,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ]),
            ],
          ]),
        ),
      ),
    );
  }
}
