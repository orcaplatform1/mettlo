import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

// ── Abonelik planı satın alma sayfası ─────────────────────────────────────────
// Ödeme gerçek iyzico entegrasyonu hazır olana kadar web'e yönlendirir.
// Ödeme tamamlandığında kullanıcı uygulamaya döner ve abonelik otomatik açılır.

class PlanCheckoutPage extends ConsumerWidget {
  const PlanCheckoutPage({
    super.key,
    required this.planId,
    required this.coachUsername,
    required this.coachDisplayName,
    required this.planName,
    required this.priceWeb,
    required this.interval,
  });

  final String planId;
  final String coachUsername;
  final String coachDisplayName;
  final String planName;
  final String priceWeb;
  final String interval;

  String get _intervalLabel => interval == 'ANNUAL' ? 'yıl' : 'ay';

  String get _webUrl => '${Env.siteUrl}/checkout/$planId';

  Future<void> _openWeb(BuildContext context) async {
    final uri = Uri.parse(_webUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tarayıcı açılamadı.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: AppBar(title: const Text('Abonelik Satın Al')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Plan özet kartı
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(coachDisplayName, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(planName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                    const SizedBox(height: 12),
                    Row(children: [
                      Text('₺$priceWeb', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: MettloColors.primary)),
                      const SizedBox(width: 4),
                      Text('/ $_intervalLabel', style: const TextStyle(fontSize: 14, color: MettloColors.textSecondary)),
                    ]),
                    const Divider(height: 24),
                    _Row(Icons.check_circle_outline, 'Koçun tüm içerik ve programlarına erişim'),
                    const SizedBox(height: 6),
                    _Row(Icons.check_circle_outline, 'Canlı dersler ve birebir koçluk'),
                    const SizedBox(height: 6),
                    _Row(Icons.check_circle_outline, 'İstediğin zaman iptal edebilirsin'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Güvenli ödeme notu
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: MettloColors.primary.withValues(alpha: .07),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: MettloColors.primary.withValues(alpha: .2)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Icon(Icons.lock_outline, size: 16, color: MettloColors.primary),
                    SizedBox(width: 6),
                    Text('Güvenli Ödeme', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: MettloColors.primary)),
                  ]),
                  SizedBox(height: 6),
                  Text(
                    'Ödeme, 256-bit SSL ile güvende olan Iyzico altyapısı üzerinden yapılır. Kart bilgilerin Mettlo'da saklanmaz.',
                    style: TextStyle(fontSize: 12, color: MettloColors.textSecondary),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: MettloColors.surface2,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Icon(Icons.info_outline, size: 15, color: MettloColors.textTertiary),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Ödeme güvenli tarayıcıda tamamlanır. Ödeme onaylandıktan sonra bu uygulamaya dönün — aboneliğiniz otomatik aktif olur.',
                    style: TextStyle(fontSize: 12, color: MettloColors.textSecondary),
                  ),
                ),
              ]),
            ),

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.open_in_browser, size: 18),
                label: const Text('Ödemeye Geç', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: MettloColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => _openWeb(context),
              ),
            ),

            if (user == null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.push('/login'),
                  child: const Text('Önce Giriş Yap'),
                ),
              ),
            ],

            const SizedBox(height: 16),
            const Center(
              child: Text(
                'Mesafeli Satış Sözleşmesi ödeme adımında gösterilir.',
                style: TextStyle(fontSize: 11, color: MettloColors.textTertiary),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 15, color: MettloColors.primary),
      const SizedBox(width: 8),
      Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: MettloColors.textSecondary))),
    ],
  );
}
