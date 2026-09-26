import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/tokens.dart';

final businessListProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, Map<String, String>>((ref, params) async {
  final query = <String, dynamic>{};
  if (params['q']?.isNotEmpty == true) query['q'] = params['q'];
  if (params['cityId']?.isNotEmpty == true) query['cityId'] = params['cityId'];
  if (params['category']?.isNotEmpty == true) query['category'] = params['category'];
  return await ref.watch(apiClientProvider).get('/business', query: query, auth: false) as Map<String, dynamic>;
});

final turkeyProvincesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/location/cities', auth: false) as List<dynamic>);

const _kCategories = {
  '': 'Tümü',
  'FITNESS_GYM': 'Spor Salonu',
  'PILATES_STUDIO': 'Pilates',
  'YOGA_STUDIO': 'Yoga',
  'BOXING_GYM': 'Boks',
  'RUNNING_CLUB': 'Koşu',
  'WELLNESS_CENTER': 'Wellness',
  'NUTRITION_CLINIC': 'Beslenme',
  'DANCE_STUDIO': 'Dans',
};

class BusinessListPage extends ConsumerStatefulWidget {
  const BusinessListPage({super.key});

  @override
  ConsumerState<BusinessListPage> createState() => _BusinessListPageState();
}

class _BusinessListPageState extends ConsumerState<BusinessListPage> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  String _category = '';
  String _cityId = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Map<String, String> get _params => {'q': _query, 'category': _category, 'cityId': _cityId};

  @override
  Widget build(BuildContext context) {
    final businesses = ref.watch(businessListProvider(_params));
    final cities = ref.watch(turkeyProvincesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('İşletmeler'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'QR ile Check-in',
            onPressed: () => context.push('/business/checkin'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Arama kutusu
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Spor salonu, yoga stüdyosu ara...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () { _searchCtrl.clear(); setState(() => _query = ''); })
                    : null,
                isDense: true,
              ),
              onChanged: (v) => setState(() => _query = v.trim()),
            ),
          ),

          // Kategori filtreleri
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _kCategories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final entry = _kCategories.entries.elementAt(i);
                final selected = _category == entry.key;
                return GestureDetector(
                  onTap: () => setState(() => _category = entry.key),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: selected ? MettloColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: selected ? MettloColors.primary : Colors.grey.shade300),
                    ),
                    child: Center(
                      child: Text(entry.value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? Colors.white : null)),
                    ),
                  ),
                );
              },
            ),
          ),

          // İl filtresi
          cities.when(
            data: (list) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: DropdownButtonFormField<String>(
                initialValue: _cityId,
                isExpanded: true,
                isDense: true,
                decoration: const InputDecoration(hintText: 'İl seç', isDense: true),
                items: [
                  const DropdownMenuItem(value: '', child: Text('Tüm İller')),
                  for (final c in list) DropdownMenuItem(value: c['id'].toString(), child: Text(c['name'] as String)),
                ],
                onChanged: (v) => setState(() => _cityId = v ?? ''),
              ),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Sonuçlar
          Expanded(
            child: businesses.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Hata: $e')),
              data: (data) {
                final items = data['items'] as List<dynamic>? ?? [];
                if (items.isEmpty) {
                  return const Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.storefront_outlined, size: 48, color: Colors.grey),
                      SizedBox(height: 12),
                      Text('İşletme bulunamadı', style: TextStyle(color: Colors.grey)),
                    ]),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(businessListProvider(_params)),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _BusinessCard(business: items[i] as Map<String, dynamic>),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _BusinessCard extends StatelessWidget {
  const _BusinessCard({required this.business});
  final Map<String, dynamic> business;

  @override
  Widget build(BuildContext context) {
    final isVerified = business['verificationStatus'] == 'APPROVED';
    final city = business['city'] as Map<String, dynamic>?;
    final district = business['district'] as Map<String, dynamic>?;
    final location = [city?['name'], district?['name']].whereType<String>().join(', ');

    return GestureDetector(
      onTap: () => context.push('/business/${business['slug']}'),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(.05), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            // Logo
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
              child: business['logoUrl'] != null
                  ? Image.network(business['logoUrl'] as String, width: 80, height: 80, fit: BoxFit.cover)
                  : Container(width: 80, height: 80, color: MettloColors.primary.withOpacity(.1),
                      child: const Icon(Icons.storefront, size: 32, color: MettloColors.primary)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Flexible(child: Text(business['name'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      if (isVerified) ...[
                        const SizedBox(width: 4),
                        const Icon(Icons.verified, size: 15, color: MettloColors.primary),
                      ],
                    ]),
                    if (business['shortDesc'] != null) ...[
                      const SizedBox(height: 2),
                      Text(business['shortDesc'] as String, style: TextStyle(fontSize: 12, color: Colors.grey.shade600), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                    const SizedBox(height: 6),
                    Wrap(spacing: 8, children: [
                      if (location.isNotEmpty)
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.place_outlined, size: 12, color: Colors.grey.shade500),
                          const SizedBox(width: 3),
                          Text(location, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                        ]),
                      if ((business['ratingCount'] as int? ?? 0) > 0)
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.star, size: 12, color: Colors.amber),
                          const SizedBox(width: 3),
                          Text('${business['ratingAvg']}', style: const TextStyle(fontSize: 11)),
                        ]),
                    ]),
                  ],
                ),
              ),
            ),
            const Padding(padding: EdgeInsets.only(right: 12), child: Icon(Icons.chevron_right, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
