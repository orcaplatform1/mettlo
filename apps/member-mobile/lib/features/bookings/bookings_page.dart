import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final bookingsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/me/bookings') as List<dynamic>);

class BookingsPage extends ConsumerWidget {
  const BookingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(bookingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Rezervasyonlarım')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(bookingsProvider),
        child: AsyncBody(
          value: list,
          onRetry: () => ref.invalidate(bookingsProvider),
          builder: (items) => items.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: InfoBanner(
                        'Yaklaşan rezervasyonun yok. Abone olduğun koçların profilinden ders rezervasyonu yapabilirsin.'),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (_, i) {
                    final b = items[i] as Map<String, dynamic>;
                    final sess = b['session'] as Map<String, dynamic>;
                    final when = DateTime.parse(sess['startsAt'] as String).toLocal();
                    final confirmed = b['status'] == 'CONFIRMED';
                    final waitlisted = b['status'] == 'WAITLISTED';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        leading: Icon(Icons.event,
                            color: confirmed ? MettloColors.success : MettloColors.warning),
                        title: Text(sess['title'] as String,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('@${(sess['creator'] as Map)['username']}',
                              style: const TextStyle(
                                  fontSize: 12, color: MettloColors.textSecondary)),
                          Text(DateFormat('d MMM y, HH:mm', 'tr').format(when)),
                          Chip(
                            label: Text(
                              confirmed
                                  ? 'Onaylı'
                                  : waitlisted
                                      ? 'Bekleme listesi'
                                      : b['status'] as String,
                              style: const TextStyle(fontSize: 11),
                            ),
                            backgroundColor: confirmed
                                ? MettloColors.success.withValues(alpha: .15)
                                : MettloColors.warning.withValues(alpha: .15),
                            padding: EdgeInsets.zero,
                          ),
                        ]),
                        trailing: confirmed
                            ? TextButton(
                                style: TextButton.styleFrom(foregroundColor: MettloColors.error),
                                onPressed: () async {
                                  try {
                                    await ref
                                        .read(apiClientProvider)
                                        .post('/me/bookings/${b['id']}/cancel');
                                    ref.invalidate(bookingsProvider);
                                  } on ApiException catch (e) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(e.message)));
                                    }
                                  }
                                },
                                child: const Text('İptal'),
                              )
                            : null,
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
