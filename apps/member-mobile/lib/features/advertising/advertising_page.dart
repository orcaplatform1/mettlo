import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

// ── Providers ─────────────────────────────────────────────────────────────────

final myAdsProvider = FutureProvider.autoDispose.family<List<dynamic>, String?>((ref, businessId) async {
  final qs = businessId != null ? '?businessId=$businessId' : '';
  final res = await ref.read(apiClientProvider).get('/advertising/my-ads$qs');
  return (res as List?) ?? const [];
});

// ── Status çevirileri ─────────────────────────────────────────────────────────

const _statusTr = {
  'DRAFT': 'Taslak',
  'SUBMITTED': 'İncelemede',
  'APPROVED': 'Onaylandı',
  'ACTIVE': 'Yayında',
  'PAUSED': 'Duraklatıldı',
  'COMPLETED': 'Tamamlandı',
  'REJECTED': 'Reddedildi',
  'PAYMENT_PENDING': 'Ödeme Bekliyor',
};

const _placementTr = {
  'FEED': 'Akış',
  'STORY': 'Hikaye',
  'SEARCH': 'Arama',
  'MAP': 'Harita',
  'BRANCH': 'Kategori',
};

const _statusColor = {
  'ACTIVE': Colors.green,
  'APPROVED': Colors.teal,
  'SUBMITTED': Colors.orange,
  'REJECTED': Colors.red,
  'DRAFT': Colors.grey,
  'PAUSED': Colors.blueGrey,
  'COMPLETED': Colors.blueGrey,
};

// ── Liste sayfası ─────────────────────────────────────────────────────────────

class AdvertisingPage extends ConsumerWidget {
  const AdvertisingPage({super.key, this.businessId});
  final String? businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(myAdsProvider(businessId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reklamlarım'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Yeni Reklam',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => NewAdPage(businessId: businessId)),
            ).then((_) => ref.invalidate(myAdsProvider)),
          ),
        ],
      ),
      body: adsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Hata: $e')),
        data: (ads) {
          if (ads.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.campaign_outlined, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  const Text('Henüz reklam yok', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  const Text('Binlerce kullanıcıya ulaşmak için\nilk reklamını oluştur.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Reklam Oluştur'),
                    style: ElevatedButton.styleFrom(backgroundColor: MettloColors.primary),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => NewAdPage(businessId: businessId)),
                    ).then((_) => ref.invalidate(myAdsProvider)),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myAdsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: ads.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _AdCard(ad: ads[i] as Map<String, dynamic>),
            ),
          );
        },
      ),
    );
  }
}

class _AdCard extends StatelessWidget {
  const _AdCard({required this.ad});
  final Map<String, dynamic> ad;

  @override
  Widget build(BuildContext context) {
    final creative = (ad['creatives'] as List?)?.cast<Map<String, dynamic>>().firstOrNull;
    final status = ad['status'] as String? ?? 'DRAFT';
    final placements = (ad['placement'] as List?)?.cast<String>() ?? const [];
    final impressions = ad['totalImpressions'] as int? ?? 0;
    final clicks = ad['totalClicks'] as int? ?? 0;
    final ctr = impressions > 0 ? (clicks / impressions * 100).toStringAsFixed(2) : '0.00';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(
                  ad['title'] as String? ?? creative?['headline'] as String? ?? 'İsimsiz Reklam',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (_statusColor[status] ?? Colors.grey).withValues(alpha: .15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusTr[status] ?? status,
                  style: TextStyle(fontSize: 11, color: _statusColor[status] ?? Colors.grey, fontWeight: FontWeight.w600),
                ),
              ),
            ]),
            if (creative?['headline'] != null && ad['title'] != null) ...[
              const SizedBox(height: 4),
              Text(creative!['headline'] as String, style: const TextStyle(fontSize: 13, color: Colors.grey)),
            ],
            if (ad['rejectionReason'] != null) ...[
              const SizedBox(height: 6),
              Text('Red nedeni: ${ad['rejectionReason']}', style: const TextStyle(fontSize: 12, color: Colors.red)),
            ],
            const SizedBox(height: 10),
            Wrap(spacing: 6, runSpacing: 4, children: [
              for (final p in placements)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: MettloColors.primary.withValues(alpha: .12), borderRadius: BorderRadius.circular(12)),
                  child: Text(_placementTr[p] ?? p, style: const TextStyle(fontSize: 11)),
                ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              _Stat(value: '$impressions', label: 'Gösterim'),
              const SizedBox(width: 20),
              _Stat(value: '$clicks', label: 'Tıklama'),
              const SizedBox(width: 20),
              _Stat(value: '$ctr%', label: 'CTR'),
            ]),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
      Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
    ],
  );
}

// ── Yeni reklam formu ─────────────────────────────────────────────────────────

class NewAdPage extends ConsumerStatefulWidget {
  const NewAdPage({super.key, this.businessId, this.ownerType = 'COACH'});
  final String? businessId;
  final String ownerType;

  @override
  ConsumerState<NewAdPage> createState() => _NewAdPageState();
}

class _NewAdPageState extends ConsumerState<NewAdPage> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _budget = TextEditingController();
  final _imageUrl = TextEditingController();
  final _headline = TextEditingController();
  final _body = TextEditingController();
  final _ctaLabel = TextEditingController(text: 'Daha Fazla');
  final _ctaUrl = TextEditingController();

  final Set<String> _placements = {'FEED'};
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_title, _budget, _imageUrl, _headline, _body, _ctaLabel, _ctaUrl]) { c.dispose(); }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_placements.isEmpty) { setState(() => _error = 'En az bir konum seç.'); return; }

    setState(() { _loading = true; _error = null; });
    try {
      final budgetKurus = (double.parse(_budget.text.replaceAll(',', '.')) * 100).round();
      final body = <String, dynamic>{
        'ownerType': widget.businessId != null ? 'BUSINESS' : widget.ownerType,
        'placement': _placements.toList(),
        'budget': budgetKurus,
        if (_title.text.trim().isNotEmpty) 'title': _title.text.trim(),
        if (widget.businessId != null) 'businessId': widget.businessId,
        'creative': {
          'imageUrl': _imageUrl.text.trim(),
          'headline': _headline.text.trim(),
          if (_body.text.trim().isNotEmpty) 'body': _body.text.trim(),
          'ctaLabel': _ctaLabel.text.trim().isEmpty ? 'Daha Fazla' : _ctaLabel.text.trim(),
          if (_ctaUrl.text.trim().isNotEmpty) 'ctaUrl': _ctaUrl.text.trim(),
        },
      };

      await ref.read(apiClientProvider).post('/advertising', body);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Yeni Reklam')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_error != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.red.shade200)),
                  child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
                ),

              _SectionTitle('Genel'),
              TextFormField(controller: _title, decoration: const InputDecoration(labelText: 'Reklam Başlığı (iç kullanım, isteğe bağlı)')),
              const SizedBox(height: 14),
              TextFormField(
                controller: _budget,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Bütçe (₺)', hintText: 'Örn: 500'),
                validator: (v) {
                  final n = double.tryParse((v ?? '').replaceAll(',', '.'));
                  if (n == null || n < 10) return 'En az 10₺ bütçe girin.';
                  return null;
                },
              ),

              const SizedBox(height: 20),
              _SectionTitle('Gösterim Konumu'),
              const Text('Birden fazla seçebilirsin.', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final entry in _placementTr.entries)
                  FilterChip(
                    label: Text(entry.value),
                    selected: _placements.contains(entry.key),
                    selectedColor: MettloColors.primary.withValues(alpha: .18),
                    onSelected: (v) => setState(() { if (v) _placements.add(entry.key); else _placements.remove(entry.key); }),
                  ),
              ]),

              const SizedBox(height: 20),
              _SectionTitle('Reklam İçeriği'),
              TextFormField(
                controller: _imageUrl,
                keyboardType: TextInputType.url,
                decoration: const InputDecoration(labelText: 'Görsel URL (HTTPS)', hintText: 'https://…'),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Görsel URL gerekli.';
                  if (!v.trim().startsWith('https://')) return 'HTTPS URL giriniz.';
                  return null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _headline,
                maxLength: 80,
                decoration: const InputDecoration(labelText: 'Başlık (Headline)', hintText: 'Dikkat çekici bir başlık'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Başlık gerekli.' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _body,
                maxLength: 150,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Açıklama (isteğe bağlı)'),
              ),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _ctaLabel,
                    maxLength: 30,
                    decoration: const InputDecoration(labelText: 'CTA Butonu Metni', counterText: ''),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _ctaUrl,
                    keyboardType: TextInputType.url,
                    decoration: const InputDecoration(labelText: 'CTA URL (isteğe bağlı)', hintText: 'https://…'),
                  ),
                ),
              ]),

              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: MettloColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Reklam Oluştur', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: MettloColors.textSecondary)),
  );
}
