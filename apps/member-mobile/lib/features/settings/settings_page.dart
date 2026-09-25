import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final privacyProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/privacy') as Map<String, dynamic>);
final healthSharingProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/health-sharing') as List<dynamic>);

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  Future<void> _open(String path) => launchUrl(Uri.parse('${Env.siteUrl}$path'), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final privacy = ref.watch(privacyProvider);
    final sharing = ref.watch(healthSharingProvider);
    final api = ref.read(apiClientProvider);
    final isCoach = user?.role == 'CREATOR';
    return ListView(padding: const EdgeInsets.all(20), children: [
      Row(children: [
        UserAvatar(name: user?.name ?? '?', url: user?.avatarUrl, size: 64),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(user?.name ?? '', style: Theme.of(context).textTheme.titleLarge), Text('@${user?.username ?? ''}', style: const TextStyle(color: MettloColors.textTertiary))])),
      ]),
      const SizedBox(height: 8),
      Text('Profil adresin: mettlo.tr/profile/${user?.username}', style: const TextStyle(color: MettloColors.textSecondary, fontSize: 12.5)),
      const SectionTitle('Profil gizliliği'),
      AsyncBody(
        value: privacy,
        builder: (p) => SwitchListTile(
          value: p['profileVisibility'] == 'public',
          activeThumbColor: MettloColors.primary,
          title: const Text('Profilim herkese açık'),
          subtitle: const Text('Kapalıyken yalnızca kullanıcı adın ve fotoğrafın görünür.', style: TextStyle(fontSize: 12.5)),
          onChanged: (v) async {
            await api.patch('/me/privacy', body: {'profileVisibility': v ? 'public' : 'private'});
            ref.invalidate(privacyProvider);
          },
        ),
      ),
      const SectionTitle('Sağlık verisi paylaşımı'),
      const Text('Verilerini yalnızca izin verdiğin koçla paylaşırsın; izni istediğin an geri alabilirsin.', style: TextStyle(color: MettloColors.textSecondary, fontSize: 13)),
      AsyncBody(
        value: sharing,
        builder: (items) => items.isEmpty
            ? const Padding(padding: EdgeInsets.only(top: 8), child: Text('Paylaşım için önce bir koça abone olmalısın.', style: TextStyle(color: MettloColors.textMuted)))
            : Column(children: [
                for (final c in items)
                  SwitchListTile(
                    value: c['sharing'] == true,
                    activeThumbColor: MettloColors.primary,
                    title: Text(c['displayName'] as String),
                    subtitle: Text('@${c['username']}', style: const TextStyle(fontSize: 12.5)),
                    onChanged: (v) async {
                      try {
                        if (v) {
                          await api.put('/me/health-sharing/${c['username']}');
                        } else {
                          await api.delete('/me/health-sharing/${c['username']}');
                        }
                      } on ApiException catch (e) {
                        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                      }
                      ref.invalidate(healthSharingProvider);
                    },
                  ),
              ]),
      ),
      const SectionTitle('Hesap'),
      ListTile(leading: const Icon(Icons.support_agent_outlined), title: const Text('Destek Merkezi'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/support')),
      ListTile(leading: const Icon(Icons.monitor_heart_outlined), title: const Text('Sağlık & İlerleme'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/health')),
      if (isCoach) ListTile(leading: const Icon(Icons.dashboard_customize_outlined), title: const Text('Koç paneli (web)'), subtitle: const Text('İçerik, plan ve öğrenci yönetimi web panelinde'), onTap: () => _open('/creator')),
      if (user?.role == 'MEMBER') ListTile(leading: const Icon(Icons.badge_outlined), title: const Text('Koç ol (web)'), onTap: () => _open('/app/become-coach')),
      ListTile(leading: const Icon(Icons.download_outlined), title: const Text('Verilerimi indir (KVKK)'), subtitle: const Text('Web sitesi > Ayarlar'), onTap: () => _open('/app/settings')),
      ListTile(leading: const Icon(Icons.delete_outline, color: MettloColors.error), title: const Text('Hesabımı sil', style: TextStyle(color: MettloColors.error)), onTap: () => _confirmDelete(context, ref)),
      const SizedBox(height: 12),
      MettloButton(label: 'Çıkış Yap', secondary: true, icon: Icons.logout, onPressed: () => ref.read(authControllerProvider.notifier).logout()),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        TextButton(onPressed: () => _open('/privacy'), child: const Text('Gizlilik')),
        TextButton(onPressed: () => _open('/data-protection'), child: const Text('KVKK')),
        TextButton(onPressed: () => _open('/terms'), child: const Text('Koşullar')),
      ]),
    ]);
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hesabı sil'),
        content: const Text('Talep sonrası 30 gün beklersin; bu sürede vazgeçebilirsin. Süre dolunca profilin, sağlık verilerin ve kişisel bilgilerin silinir. Yasal saklama yükümlülüğü olan fatura ve ödeme kayıtları hariçtir.'),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Vazgeç')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Talep oluştur', style: TextStyle(color: MettloColors.error)))],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiClientProvider).post('/account/deletion-request');
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Silme talebin alındı. 30 gün içinde vazgeçebilirsin.')));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}
