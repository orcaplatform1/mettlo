import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../theme/tokens.dart';

// ── Provider ──────────────────────────────────────────────────────────────────

final adProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>((ref, placement) async {
  try {
    final res = await ref.read(apiClientProvider).get('/advertising/serve?placement=$placement&platform=MOBILE');
    return res as Map<String, dynamic>?;
  } catch (_) { return null; }
});

// ── Widget ────────────────────────────────────────────────────────────────────

class AdBannerWidget extends ConsumerStatefulWidget {
  const AdBannerWidget({super.key, required this.placement});
  final String placement;

  @override
  ConsumerState<AdBannerWidget> createState() => _AdBannerWidgetState();
}

class _AdBannerWidgetState extends ConsumerState<AdBannerWidget> {
  bool _dismissed = false;
  bool _clicked = false;

  void _recordClick(String adId, Map<String, dynamic> creative) {
    if (_clicked) return;
    _clicked = true;
    ref.read(apiClientProvider).post('/advertising/$adId/click', {'platform': 'MOBILE'}).catchError((_) {});
    final url = creative['ctaUrl'] as String?;
    if (url != null && url.isNotEmpty) {
      // URL açma için url_launcher kullanılabilir; şimdilik sadece click kaydediyoruz
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final adAsync = ref.watch(adProvider(widget.placement));
    return adAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (ad) {
        if (ad == null) return const SizedBox.shrink();
        final creatives = (ad['creatives'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        if (creatives.isEmpty) return const SizedBox.shrink();
        final creative = creatives.first;
        final business = ad['business'] as Map<String, dynamic>?;

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (creative['imageUrl'] != null)
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      child: Image.network(
                        creative['imageUrl'] as String,
                        height: 130, width: double.infinity, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(4)),
                            child: const Text('SPONSORLU', style: TextStyle(fontSize: 9, color: Colors.white, letterSpacing: 0.5)),
                          ),
                          if (business != null) ...[
                            const SizedBox(width: 6),
                            Text(business['name'] as String, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          ],
                        ]),
                        const SizedBox(height: 6),
                        Text(creative['headline'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        if (creative['body'] != null) ...[
                          const SizedBox(height: 3),
                          Text(creative['body'] as String, style: const TextStyle(fontSize: 12, color: Colors.grey), maxLines: 2, overflow: TextOverflow.ellipsis),
                        ],
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () => _recordClick(ad['id'] as String, creative),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            minimumSize: const Size(0, 32),
                            backgroundColor: MettloColors.primary,
                          ),
                          child: Text(creative['ctaLabel'] as String, style: const TextStyle(fontSize: 12, color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Kapat butonu
              Positioned(
                top: 6,
                right: 6,
                child: GestureDetector(
                  onTap: () => setState(() => _dismissed = true),
                  child: Container(
                    width: 22, height: 22,
                    decoration: BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                    child: const Icon(Icons.close, size: 14, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
