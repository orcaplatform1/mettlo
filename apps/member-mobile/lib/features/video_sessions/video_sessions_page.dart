import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final videoSessionsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final data = await ref.watch(apiClientProvider).get('/me/video-sessions');
  return data as Map<String, dynamic>;
});

final videoPacksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final data = await ref.watch(apiClientProvider).get('/live/video-packs');
  return data as List<dynamic>;
});

class VideoSessionsPage extends ConsumerWidget {
  const VideoSessionsPage({super.key});

  String _fmtDate(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso)?.toLocal();
    return d == null ? '' : '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vs = ref.watch(videoSessionsProvider);
    final packs = ref.watch(videoPacksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('1:1 Görüntülü Koçluk')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async {
          ref.invalidate(videoSessionsProvider);
          ref.invalidate(videoPacksProvider);
        },
        child: ListView(padding: const EdgeInsets.all(16), children: [
          // Bakiye özeti
          vs.when(
            loading: () => const SizedBox(height: 80, child: Center(child: CircularProgressIndicator.adaptive())),
            error: (_, _) => const SizedBox.shrink(),
            data: (data) {
              final total = (data['totalRemaining'] as num?)?.toInt() ?? 0;
              final balances = (data['balances'] as List<dynamic>?) ?? [];
              final active = balances.where((b) => ((b['remaining'] as num?)?.toInt() ?? 0) > 0).toList();
              return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: MettloColors.surface1,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: MettloColors.borderSubtle),
                  ),
                  child: Row(children: [
                    const Icon(Icons.videocam_outlined, color: MettloColors.primary, size: 32),
                    const SizedBox(width: 14),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('$total oturum hakkı', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                      const Text('Kalan 1:1 görüntülü koçluk', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                    ]),
                  ]),
                ),
                if (active.isNotEmpty) ...[
                  const SectionTitle('Aktif Bakiyeler'),
                  for (final b in active)
                    Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: MettloColors.surface1,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: MettloColors.borderSubtle),
                      ),
                      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text((b['pack']?['name'] as String?) ?? '1:1 Koçluk', style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text('Son kullanma: ${_fmtDate(b['expiresAt'] as String?)}', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12.5)),
                        ]),
                        Text('${(b['remaining'] as num).toInt()} oturum', style: const TextStyle(fontWeight: FontWeight.w700, color: MettloColors.primary)),
                      ]),
                    ),
                ],
              ]);
            },
          ),

          const SectionTitle('Paket Satın Al'),
          packs.when(
            loading: () => const Center(child: CircularProgressIndicator.adaptive()),
            error: (_, _) => const Text('Paketler yüklenemedi.', style: TextStyle(color: MettloColors.textSecondary)),
            data: (list) => Column(children: [
              for (final pack in list)
                _PackCard(pack: pack, onPurchase: () async {
                  try {
                    await ref.read(apiClientProvider).post('/live/video-packs/${pack['id']}/purchase', body: {});
                    ref.invalidate(videoSessionsProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Satın alma başarılı! Bakiyeniz güncellendi.'), backgroundColor: MettloColors.success),
                      );
                    }
                  } on ApiException catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(e.message), backgroundColor: MettloColors.error),
                      );
                    }
                  }
                }),
            ]),
          ),

          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: MettloColors.surface1,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: MettloColors.borderSubtle),
            ),
            child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Bağlantı Koruması', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              SizedBox(height: 6),
              Text(
                'Oturum sırasında bağlantın kesilirse 15 dakika içinde yeniden bağlanabilirsin. '
                'Oturum hakkın yalnızca oturum başarıyla tamamlandığında düşülür.',
                style: TextStyle(color: MettloColors.textSecondary, fontSize: 13),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _PackCard extends StatefulWidget {
  const _PackCard({required this.pack, required this.onPurchase});
  final Map pack;
  final Future<void> Function() onPurchase;
  @override
  State<_PackCard> createState() => _PackCardState();
}

class _PackCardState extends State<_PackCard> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final sessions = (widget.pack['sessions'] as num).toInt();
    final price = (widget.pack['priceWeb'] as num).toDouble();
    final perSession = sessions > 0 ? price / sessions : price;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MettloColors.surface1,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: sessions == 5 ? MettloColors.primary : MettloColors.borderSubtle, width: sessions == 5 ? 1.5 : 1),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (sessions == 5) Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: MettloColors.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(6)), child: const Text('Popüler', style: TextStyle(color: MettloColors.primary, fontSize: 11, fontWeight: FontWeight.w700))),
          if (sessions == 5) const SizedBox(height: 4),
          Text('$sessions Oturum', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          Text('${price.toStringAsFixed(0)} ₺ · ${perSession.toStringAsFixed(0)} ₺/oturum', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
          Text('180 gün geçerli', style: const TextStyle(color: MettloColors.textTertiary, fontSize: 12)),
        ])),
        const SizedBox(width: 12),
        SizedBox(
          width: 90,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: MettloColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 10)),
            onPressed: _loading ? null : () async {
              setState(() => _loading = true);
              await widget.onPurchase();
              if (mounted) setState(() => _loading = false);
            },
            child: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Satın Al'),
          ),
        ),
      ]),
    );
  }
}
