import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/config/env.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final healthSharingProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/me/health-sharing') as List<dynamic>);
final blocksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async => await ref.watch(apiClientProvider).get('/blocks') as List<dynamic>);

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  Future<void> _open(String path) => launchUrl(Uri.parse('${Env.siteUrl}$path'), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
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
      const SectionTitle('Engellenen Kullanıcılar'),
      Consumer(builder: (context, ref, _) {
        final blocks = ref.watch(blocksProvider);
        return blocks.when(
          loading: () => const Center(child: CircularProgressIndicator.adaptive()),
          error: (_, _) => const SizedBox.shrink(),
          data: (items) => items.isEmpty
              ? const Padding(padding: EdgeInsets.only(top: 4), child: Text('Engellenen kullanıcı yok.', style: TextStyle(color: MettloColors.textMuted)))
              : Column(children: [
                  for (final b in items)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: UserAvatar(name: b['blocked']['name'] as String? ?? '?', url: b['blocked']['avatarUrl'] as String?),
                      title: Text(b['blocked']['name'] as String? ?? ''),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('@${b['blocked']['username']}', style: const TextStyle(fontSize: 12)),
                        if (b['reason'] != null) Text(b['reason'] as String, style: const TextStyle(fontSize: 12, color: MettloColors.textTertiary), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ]),
                      trailing: TextButton(
                        onPressed: () async {
                          try {
                            await ref.read(apiClientProvider).delete('/blocks/${b['blocked']['username']}');
                            ref.invalidate(blocksProvider);
                          } on ApiException catch (e) {
                            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                          }
                        },
                        child: const Text('Kaldır'),
                      ),
                    ),
                ]),
        );
      }),
      const SectionTitle('Hesap'),
      ListTile(leading: const Icon(Icons.notifications_outlined), title: const Text('Bildirimler'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/notifications')),
      ListTile(leading: const Icon(Icons.event_available_outlined), title: const Text('Rezervasyonlarım'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/bookings')),
      if (['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].contains(user?.role))
        ListTile(leading: const Icon(Icons.flag_outlined, color: MettloColors.error), title: const Text('Şikayet Yönetimi', style: TextStyle(fontWeight: FontWeight.w600)), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/moderation')),
      ListTile(leading: const Icon(Icons.support_agent_outlined), title: const Text('Destek Merkezi'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/support')),
      ListTile(leading: const Icon(Icons.monitor_heart_outlined), title: const Text('Sağlık & İlerleme'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/health')),
      ListTile(leading: const Icon(Icons.videocam_outlined, color: MettloColors.primary), title: const Text('1:1 Görüntülü Koçluk'), subtitle: const Text('Oturum haklarım ve paket satın alma'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/video-sessions')),
      if (isCoach) ListTile(leading: const Icon(Icons.people_outline), title: const Text('Abonelerim'), subtitle: const Text('Aktif ve geçmiş abone listesi, ödeme özeti'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/subscribers')),
      if (isCoach) ListTile(leading: const Icon(Icons.supervised_user_circle_outlined), title: const Text('Müşterilerim'), subtitle: const Text('Hedefler, metrikler, check-in ve değerlendirmeler'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/coaching/clients')),
      if (isCoach) ListTile(leading: const Icon(Icons.campaign_outlined, color: MettloColors.primary), title: const Text('Reklamlarım'), subtitle: const Text('Reklam oluştur ve performansı takip et'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/advertising')),
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
