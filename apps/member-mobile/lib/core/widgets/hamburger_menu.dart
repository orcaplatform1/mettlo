import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../auth/auth_controller.dart';
import '../config/env.dart';
import '../theme/tokens.dart';

/// Hamburger menü butonu — AppBar actions'a ekle.
class HamburgerButton extends StatelessWidget {
  const HamburgerButton({super.key});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 12),
        child: GestureDetector(
          onTap: () => showHamburgerMenu(context),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: MettloColors.surface1,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: MettloColors.borderSubtle),
            ),
            child: const Icon(Icons.menu, color: MettloColors.textPrimary, size: 20),
          ),
        ),
      );
}

void showHamburgerMenu(BuildContext context) {
  final router = GoRouter.of(context);
  Navigator.of(context, rootNavigator: true).push(
    PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black54,
      barrierDismissible: true,
      transitionDuration: const Duration(milliseconds: 220),
      reverseTransitionDuration: const Duration(milliseconds: 180),
      pageBuilder: (ctx, anim, _) => _HamburgerMenuPage(router: router),
      transitionsBuilder: (ctx, anim, _, child) => SlideTransition(
        position: Tween(begin: const Offset(1, 0), end: Offset.zero)
            .animate(CurvedAnimation(parent: anim, curve: MettloMotion.curve)),
        child: child,
      ),
    ),
  );
}

class _HamburgerMenuPage extends ConsumerWidget {
  const _HamburgerMenuPage({required this.router});
  final GoRouter router;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final role = auth.user?.role ?? '';
    final isAdmin = role == 'ADMIN' || role == 'SUPERADMIN' || role == 'MODERATOR';
    final isCoach = role == 'CREATOR';
    final isBusiness = role == 'BUSINESS';

    return Align(
      alignment: Alignment.centerRight,
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: MediaQuery.of(context).size.width * 0.80,
          height: double.infinity,
          color: const Color(0xFF0F1628),
          child: SafeArea(
            child: Column(children: [
              // Başlık
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('METTLO', style: TextStyle(color: MettloColors.primary, fontWeight: FontWeight.w800, letterSpacing: 2, fontSize: 14)),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(color: MettloColors.surface2, borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.close, color: MettloColors.textPrimary, size: 18),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ]),
              ),
              const Divider(color: MettloColors.borderSubtle, height: 1),
              Expanded(
                child: ListView(padding: const EdgeInsets.symmetric(vertical: 8), children: [
                  // Kurumsal
                  _SmallLabel('METTLO'),
                  _MenuItem('Hakkımızda', onTap: () => _openUrl(context, '/hakkimizda')),
                  _MenuItem('Ekibimiz', onTap: () => _openUrl(context, '/team')),
                  _MenuItem('Kariyer', onTap: () => _openUrl(context, '/careers')),
                  const Divider(color: MettloColors.borderSubtle, height: 24, indent: 20, endIndent: 20),

                  // Ana navigasyon
                  _NavItem(context, 'Keşfet', Icons.explore_outlined, '/discover'),
                  _NavItem(context, 'Programlar', Icons.fitness_center_outlined, '/programs'),
                  _NavItem(context, 'Koçlar', Icons.person_outlined, '/discover'),
                  _NavItem(context, 'Canlı Dersler', Icons.radio_outlined, '/live'),
                  _NavItem(context, 'Etkinlikler', Icons.event_outlined, '/events'),
                  _NavItem(context, 'Topluluk', Icons.people_outline, '/community'),
                  _NavItem(context, 'Challenge\'lar', Icons.emoji_events_outlined, '/challenges'),
                  _NavItem(context, 'İşletmeler', Icons.store_outlined, '/business'),
                  _NavItem(context, 'Restoranlar', Icons.restaurant_outlined, '/restaurants'),
                  _NavItem(context, 'İş İlanları', Icons.work_outline, '/jobs'),

                  if (isCoach) ...[
                    const Divider(color: MettloColors.borderSubtle, height: 24, indent: 20, endIndent: 20),
                    _SmallLabel('KOÇ PANELİ'),
                    _NavItem(context, 'Abonelerim', Icons.people_outline, '/subscribers'),
                    _NavItem(context, 'Müşterilerim', Icons.supervised_user_circle_outlined, '/coaching/clients'),
                    _NavItem(context, 'Gelirlerim', Icons.account_balance_wallet_outlined, '/earnings'),
                    _NavItem(context, 'Reklamlarım', Icons.campaign_outlined, '/advertising'),
                    _NavItem(context, 'Çalıştığım Yerler', Icons.location_on_outlined, '/coach/workplaces'),
                    _MenuItem('Web Koç Paneli', onTap: () => _openUrl(context, '/creator')),
                  ],

                  if (isBusiness) ...[
                    const Divider(color: MettloColors.borderSubtle, height: 24, indent: 20, endIndent: 20),
                    _SmallLabel('İŞLETME PANELİ'),
                    _NavItem(context, 'İşletme Profilim', Icons.store_outlined, '/business'),
                    _NavItem(context, 'Reklamlarım', Icons.campaign_outlined, '/advertising'),
                    _MenuItem('Web İşletme Paneli', onTap: () => _openUrl(context, '/creator')),
                  ],

                  if (isAdmin) ...[
                    const Divider(color: MettloColors.borderSubtle, height: 24, indent: 20, endIndent: 20),
                    _SmallLabel('YÖNETİM'),
                    _NavItem(context, 'Şikayet Yönetimi', Icons.flag_outlined, '/moderation'),
                    _MenuItem('Web Admin Paneli', onTap: () => _openUrl(context, '/admin')),
                  ],

                  if (auth.status == AuthStatus.signedIn) ...[
                    const Divider(color: MettloColors.borderSubtle, height: 24, indent: 20, endIndent: 20),
                    _MenuItem(
                      'Çıkış Yap',
                      color: MettloColors.error,
                      onTap: () {
                        Navigator.of(context).pop();
                        ref.read(authControllerProvider.notifier).logout();
                      },
                    ),
                  ],

                  const SizedBox(height: 24),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20),
                    child: Text('© 2025 Mettlo. Tüm hakları saklıdır.', style: TextStyle(color: MettloColors.textMuted, fontSize: 11)),
                  ),
                  const SizedBox(height: 16),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _NavItem(BuildContext context, String label, IconData icon, String route) => ListTile(
        dense: false,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
        leading: Icon(icon, color: MettloColors.textSecondary, size: 20),
        title: Text(label, style: const TextStyle(color: MettloColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
        onTap: () {
          Navigator.of(context).pop();
          router.go(route);
        },
      );

  Widget _SmallLabel(String text) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
        child: Text(text, style: const TextStyle(color: MettloColors.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
      );

  Widget _MenuItem(String label, {required VoidCallback onTap, Color? color}) => ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
        title: Text(label, style: TextStyle(color: color ?? MettloColors.textSecondary, fontSize: 15)),
        onTap: onTap,
      );

  void _openUrl(BuildContext context, String path) {
    Navigator.of(context).pop();
    launchUrl(Uri.parse('${Env.siteUrl}$path'), mode: LaunchMode.externalApplication);
  }
}
