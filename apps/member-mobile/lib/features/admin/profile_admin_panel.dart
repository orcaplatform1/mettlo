import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';

const _kAdminRoles = ['SUPER_ADMIN', 'ADMIN'];

final _staffSummaryProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>(
  (ref, username) async {
    try {
      return await ref.watch(apiClientProvider).get('/admin/profiles/${Uri.encodeComponent(username)}/staff') as Map<String, dynamic>;
    } on ApiException catch (_) {
      return null;
    }
  },
);

final _superAdminProfileProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>(
  (ref, username) async {
    try {
      return await ref.watch(apiClientProvider).get('/admin/profiles/${Uri.encodeComponent(username)}') as Map<String, dynamic>;
    } on ApiException catch (_) {
      return null;
    }
  },
);

/// Profil sayfalarında ADMIN/SUPER_ADMIN için görünen yönetim paneli.
class ProfileAdminPanel extends ConsumerWidget {
  const ProfileAdminPanel({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    if (user == null || !_kAdminRoles.contains(user.role)) return const SizedBox.shrink();
    if (user.role == 'SUPER_ADMIN') return _SuperAdminSection(username: username);
    return _StaffSection(username: username);
  }
}

// ── Staff Panel (ADMIN) ──

class _StaffSection extends ConsumerWidget {
  const _StaffSection({required this.username});
  final String username;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_staffSummaryProvider(username));
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (u) => u == null ? const SizedBox.shrink() : _StaffPanelCard(u: u, username: username),
    );
  }
}

class _StaffPanelCard extends ConsumerStatefulWidget {
  const _StaffPanelCard({required this.u, required this.username});
  final Map<String, dynamic> u;
  final String username;
  @override
  ConsumerState<_StaffPanelCard> createState() => _StaffPanelCardState();
}

class _StaffPanelCardState extends ConsumerState<_StaffPanelCard> {
  bool _expanded = false;
  bool _suspendExpanded = false;
  final _reason = TextEditingController();
  int _days = 7;
  bool _busy = false;

  @override
  void dispose() { _reason.dispose(); super.dispose(); }

  Future<void> _approveCoach() async {
    try {
      await ref.read(apiClientProvider).post('/admin/creators/${widget.username}/approve');
      ref.invalidate(_staffSummaryProvider(widget.username));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Koç başvurusu onaylandı.')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _rejectCoach() async {
    final ctrl = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Başvuruyu Reddet'),
        content: TextField(controller: ctrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Reddetme nedeni')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Reddet')),
        ],
      ),
    );
    ctrl.dispose();
    if (reason == null || reason.isEmpty) return;
    try {
      await ref.read(apiClientProvider).post('/admin/creators/${widget.username}/reject', body: {'reason': reason});
      ref.invalidate(_staffSummaryProvider(widget.username));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Koç başvurusu reddedildi.')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _suspend() async {
    final reason = _reason.text.trim();
    if (reason.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/admin/users/${widget.u['id']}/sanction', body: {'type': 'SUSPENSION', 'reason': reason, 'days': _days});
      ref.invalidate(_staffSummaryProvider(widget.username));
      if (mounted) setState(() { _suspendExpanded = false; _reason.clear(); });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Kullanıcı askıya alındı.')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _liftSanction(String id) async {
    try {
      await ref.read(apiClientProvider).post('/admin/sanctions/$id/lift');
      ref.invalidate(_staffSummaryProvider(widget.username));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.u;
    final c = u['creatorProfile'] as Map<String, dynamic>?;
    final sanctions = (u['accountSanctions'] as List?) ?? [];
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF0D1520), borderRadius: BorderRadius.circular(MettloRadius.lg), border: Border.all(color: const Color(0xFF1E3A5F))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          behavior: HitTestBehavior.opaque,
          child: Row(children: [
            const Icon(Icons.manage_accounts, size: 15, color: Color(0xFF60A5FA)),
            const SizedBox(width: 8),
            const Text('ADMIN GÖRÜNÜMÜ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1, color: Color(0xFF60A5FA))),
            const Spacer(),
            Icon(_expanded ? Icons.expand_less : Icons.expand_more, color: MettloColors.textTertiary, size: 18),
          ]),
        ),
        const SizedBox(height: 8),
        Wrap(spacing: 6, runSpacing: 6, children: [
          _BadgeChip(u['role'] == 'CREATOR' ? 'Koç' : u['role'] == 'SUBSCRIBER' ? 'Abone' : 'Üye'),
          _BadgeChip(u['status'] as String? ?? '', danger: u['status'] != 'ACTIVE'),
          if (c != null) _BadgeChip('Koç: ${c['status']}', ok: c['status'] == 'APPROVED'),
        ]),
        if (_expanded) ...[
          const SizedBox(height: 10),
          if (sanctions.isNotEmpty) ...[
            const Text('Yaptırımlar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Colors.orange)),
            const SizedBox(height: 4),
            for (final s in sanctions)
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: Text('${s['type'] == 'SUSPENSION' ? 'Askı' : 'Yasak'}: ${s['reason']}', style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary))),
                TextButton(onPressed: () => _liftSanction(s['id'] as String), style: TextButton.styleFrom(padding: EdgeInsets.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap, minimumSize: Size.zero), child: const Text('Kaldır', style: TextStyle(fontSize: 11))),
              ]),
            const SizedBox(height: 6),
          ],
          if (c != null && c['status'] == 'PENDING') ...[
            const Text('Koç Başvurusu', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(child: OutlinedButton(style: OutlinedButton.styleFrom(foregroundColor: Colors.green, side: const BorderSide(color: Colors.green), padding: const EdgeInsets.symmetric(vertical: 6)), onPressed: _approveCoach, child: const Text('Onayla', style: TextStyle(fontSize: 12)))),
              const SizedBox(width: 8),
              Expanded(child: OutlinedButton(style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red), padding: const EdgeInsets.symmetric(vertical: 6)), onPressed: _rejectCoach, child: const Text('Reddet', style: TextStyle(fontSize: 12)))),
            ]),
            const SizedBox(height: 8),
          ],
          if (!_suspendExpanded)
            TextButton.icon(
              onPressed: () => setState(() => _suspendExpanded = true),
              style: TextButton.styleFrom(padding: EdgeInsets.zero, foregroundColor: Colors.orange, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
              icon: const Icon(Icons.pause_circle_outline, size: 14),
              label: const Text('Askıya Al', style: TextStyle(fontSize: 12)),
            )
          else ...[
            TextField(controller: _reason, maxLines: 2, style: const TextStyle(fontSize: 12), decoration: const InputDecoration(labelText: 'Neden?', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8))),
            const SizedBox(height: 6),
            Wrap(spacing: 4, runSpacing: 4, children: [
              const Text('Süre:', style: TextStyle(fontSize: 11, color: MettloColors.textTertiary)),
              for (final d in [1, 3, 7, 14, 30, 90])
                GestureDetector(
                  onTap: () => setState(() => _days = d),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: _days == d ? MettloColors.primary : MettloColors.surface2, borderRadius: BorderRadius.circular(6)),
                    child: Text('$d g', style: TextStyle(fontSize: 11, color: _days == d ? Colors.white : MettloColors.textSecondary)),
                  ),
                ),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              FilledButton(
                onPressed: _busy ? null : _suspend,
                style: FilledButton.styleFrom(backgroundColor: Colors.orange, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
                child: _busy ? const SizedBox.square(dimension: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Askıya Al', style: TextStyle(fontSize: 12)),
              ),
              const SizedBox(width: 8),
              TextButton(onPressed: () => setState(() => _suspendExpanded = false), child: const Text('İptal', style: TextStyle(fontSize: 12))),
            ]),
          ],
        ],
      ]),
    );
  }
}

// ── SuperAdmin Panel (SUPER_ADMIN) ──

class _SuperAdminSection extends ConsumerWidget {
  const _SuperAdminSection({required this.username});
  final String username;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_superAdminProfileProvider(username));
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) {
        if (data == null) return const SizedBox.shrink();
        return Column(children: [
          _SuperAdminCard(data: data, username: username),
          _SuperAdminDetails(data: data, username: username),
        ]);
      },
    );
  }
}

class _SuperAdminCard extends StatelessWidget {
  const _SuperAdminCard({required this.data, required this.username});
  final Map<String, dynamic> data;
  final String username;

  @override
  Widget build(BuildContext context) {
    final p = (data['personal'] as Map<String, dynamic>?) ?? {};
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF110A1A), borderRadius: BorderRadius.circular(MettloRadius.lg), border: Border.all(color: const Color(0xFF3B1A4E))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.shield_outlined, size: 15, color: Color(0xFFA855F7)),
          SizedBox(width: 8),
          Text('SÜPER ADMIN GÖRÜNÜMÜ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1, color: Color(0xFFA855F7))),
        ]),
        const SizedBox(height: 10),
        _KvRow('E-posta', data['email'] as String? ?? '—'),
        _KvRow('Telefon', p['phone'] as String? ?? '—'),
        _KvRow('Rol', data['role'] as String? ?? '—'),
        _KvRow('Durum', data['status'] as String? ?? '—'),
        _KvRow('Kayıt', _fmtDate(data['createdAt'] as String?)),
        _KvRow('Son giriş', _fmtDate(data['lastLoginAt'] as String?)),
        if (p['address'] != null && (p['address'] as String).isNotEmpty) _KvRow('Adres', p['address'] as String),
        if (data['deletionRequest'] != null)
          _KvRow('Silme talebi', 'Durum: ${(data['deletionRequest'] as Map)['status']}'),
      ]),
    );
  }

  String _fmtDate(String? iso) {
    if (iso == null) return '—';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) { return iso; }
  }
}

class _SuperAdminDetails extends StatefulWidget {
  const _SuperAdminDetails({required this.data, required this.username});
  final Map<String, dynamic> data;
  final String username;
  @override
  State<_SuperAdminDetails> createState() => _SuperAdminDetailsState();
}

class _SuperAdminDetailsState extends State<_SuperAdminDetails> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final c = data['creatorProfile'] as Map<String, dynamic>?;
    final subs = (data['subscriptions'] as List?) ?? [];
    final payments = (data['payments'] as List?) ?? [];
    final sanctions = (data['sanctions'] as List?) ?? [];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF0D1520), borderRadius: BorderRadius.circular(MettloRadius.lg), border: Border.all(color: const Color(0xFF1E3A5F))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          behavior: HitTestBehavior.opaque,
          child: Row(children: [
            const Text('Hesap Detayları', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF60A5FA))),
            const Spacer(),
            Icon(_expanded ? Icons.expand_less : Icons.expand_more, color: MettloColors.textTertiary, size: 18),
          ]),
        ),
        if (_expanded) ...[
          const SizedBox(height: 10),
          if (c != null) ...[
            const Text('Koç Profili', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            const SizedBox(height: 4),
            _KvRow('Durum', '${c['status']} ${c['isPublic'] == true ? '(yayında)' : '(gizli)'}'),
            _KvRow('Abone / Takipçi', '${c['subscribersCount'] ?? 0} / ${c['followersCount'] ?? 0}'),
            _KvRow('Puan', '${c['ratingAvg'] ?? 0} (${c['ratingCount'] ?? 0} yorum)'),
            const SizedBox(height: 8),
          ],
          if (subs.isNotEmpty) ...[
            Text('Abonelikler (${subs.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            const SizedBox(height: 4),
            for (final s in subs.take(5))
              Padding(padding: const EdgeInsets.only(bottom: 3), child: Text('• ${(s['plan'] as Map?)?['name'] ?? '?'} · ${s['status']}', style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary))),
            const SizedBox(height: 8),
          ],
          if (payments.isNotEmpty) ...[
            Text('Ödemeler (${payments.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            const SizedBox(height: 4),
            for (final p in payments.take(5))
              Padding(padding: const EdgeInsets.only(bottom: 3), child: Text('• ${p['kind']} · ${p['status']} · ${(p['amount'] as num? ?? 0) / 100} ₺', style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary))),
            const SizedBox(height: 8),
          ],
          if (sanctions.isNotEmpty) ...[
            Text('Yaptırım geçmişi (${sanctions.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Colors.orange)),
            const SizedBox(height: 4),
            for (final s in sanctions)
              Padding(padding: const EdgeInsets.only(bottom: 3), child: Text('• ${s['type']} · ${s['status']} · ${s['reason']}', style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary))),
          ],
        ],
      ]),
    );
  }
}

// ── Shared helpers ──

class _BadgeChip extends StatelessWidget {
  const _BadgeChip(this.label, {this.ok = false, this.danger = false});
  final String label;
  final bool ok, danger;
  @override
  Widget build(BuildContext context) {
    final color = ok ? Colors.green : danger ? Colors.red : const Color(0xFF60A5FA);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: .14), borderRadius: BorderRadius.circular(6), border: Border.all(color: color.withValues(alpha: .3))),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

class _KvRow extends StatelessWidget {
  const _KvRow(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 5),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 11, color: MettloColors.textTertiary))),
      Expanded(child: Text(value, style: const TextStyle(fontSize: 11, color: MettloColors.textSecondary))),
    ]),
  );
}
