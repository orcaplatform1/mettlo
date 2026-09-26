import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/tokens.dart';

// ── Providers ────────────────────────────────────────────────────────────────

final foodMenuProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, businessId) async {
  final res = await ref.read(apiClientProvider).get('/business/$businessId/menu');
  return res as Map<String, dynamic>;
});

// ── Sepet state ───────────────────────────────────────────────────────────────

class CartNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  CartNotifier() : super([]);

  void add(Map<String, dynamic> item) {
    final idx = state.indexWhere((i) => i['id'] == item['id']);
    if (idx >= 0) {
      final updated = [...state];
      updated[idx] = { ...updated[idx], 'qty': (updated[idx]['qty'] as int) + 1 };
      state = updated;
    } else {
      state = [...state, { ...item, 'qty': 1 }];
    }
  }

  void remove(String itemId) {
    final idx = state.indexWhere((i) => i['id'] == itemId);
    if (idx < 0) return;
    if ((state[idx]['qty'] as int) <= 1) {
      state = state.where((i) => i['id'] != itemId).toList();
    } else {
      final updated = [...state];
      updated[idx] = { ...updated[idx], 'qty': (updated[idx]['qty'] as int) - 1 };
      state = updated;
    }
  }

  void clear() => state = [];

  int qty(String itemId) {
    try { return state.firstWhere((i) => i['id'] == itemId)['qty'] as int; }
    catch (_) { return 0; }
  }

  int get totalKurus => state.fold(0, (s, i) => s + (i['priceKurus'] as int) * (i['qty'] as int));
}

final cartProvider = StateNotifierProvider.autoDispose.family<CartNotifier, List<Map<String, dynamic>>, String>(
  (ref, _) => CartNotifier(),
);

// ── Sayfa ─────────────────────────────────────────────────────────────────────

class FoodMenuPage extends ConsumerStatefulWidget {
  const FoodMenuPage({super.key, required this.businessId, required this.businessName});
  final String businessId;
  final String businessName;

  @override
  ConsumerState<FoodMenuPage> createState() => _FoodMenuPageState();
}

class _FoodMenuPageState extends ConsumerState<FoodMenuPage> {
  String? _activeCatId;
  bool _ordering = false;
  String? _orderError;
  bool _ordered = false;
  final _noteCtrl = TextEditingController();

  @override
  void dispose() { _noteCtrl.dispose(); super.dispose(); }

  String _fmtTL(int kurus) {
    final tl = kurus / 100;
    return '₺${tl.toStringAsFixed(tl.truncateToDouble() == tl ? 0 : 2)}';
  }

  Future<void> _placeOrder() async {
    final cart = ref.read(cartProvider(widget.businessId));
    if (cart.isEmpty) return;
    setState(() { _ordering = true; _orderError = null; });
    try {
      await ref.read(apiClientProvider).post('/food-orders', {
        'businessId': widget.businessId,
        'items': cart.map((i) => { 'foodItemId': i['id'], 'quantity': i['qty'] }).toList(),
        if (_noteCtrl.text.trim().isNotEmpty) 'note': _noteCtrl.text.trim(),
      });
      ref.read(cartProvider(widget.businessId).notifier).clear();
      if (mounted) setState(() { _ordered = true; _ordering = false; });
    } catch (e) {
      if (mounted) setState(() { _orderError = e.toString(); _ordering = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final menuAsync = ref.watch(foodMenuProvider(widget.businessId));
    final cart = ref.watch(cartProvider(widget.businessId));
    final cartNotifier = ref.read(cartProvider(widget.businessId).notifier);
    final cartTotal = cartNotifier.totalKurus;
    final cartCount = cart.fold(0, (s, i) => s + (i['qty'] as int));

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.businessName),
        actions: [
          if (cartCount > 0)
            TextButton.icon(
              onPressed: () => _showCartSheet(context, cart, cartNotifier, cartTotal),
              icon: const Icon(Icons.shopping_cart),
              label: Text('$cartCount'),
            ),
        ],
      ),
      body: menuAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Menü yüklenemedi.')),
        data: (d) {
          final categories = (d['categories'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final allItems = (d['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final items = allItems.where((i) => i['status'] == 'AVAILABLE').where((i) => _activeCatId == null || i['categoryId'] == _activeCatId).toList();

          if (_ordered) {
            return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.check_circle, color: Colors.green, size: 56),
              SizedBox(height: 12),
              Text('Siparişiniz alındı!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ]));
          }

          return Column(
            children: [
              // Kategori filtresi
              if (categories.isNotEmpty)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                  child: Row(children: [
                    _CatChip(label: 'Tümü', active: _activeCatId == null, onTap: () => setState(() => _activeCatId = null)),
                    ...categories.map((c) => _CatChip(
                      label: c['name'] ?? '',
                      active: _activeCatId == c['id'],
                      onTap: () => setState(() => _activeCatId = _activeCatId == c['id'] ? null : c['id']),
                    )),
                  ]),
                ),

              // Ürünler
              Expanded(
                child: items.isEmpty
                    ? const Center(child: Text('Bu kategoride ürün yok.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: items.length,
                        itemBuilder: (_, i) {
                          final item = items[i];
                          final qty = cartNotifier.qty(item['id'] as String);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (item['imageUrl'] != null)
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.network(item['imageUrl'] as String, width: 70, height: 70, fit: BoxFit.cover),
                                    ),
                                  const SizedBox(width: 10),
                                  Expanded(child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                      if (item['description'] != null)
                                        Text(item['description'] as String, style: const TextStyle(fontSize: 12, color: Colors.grey), maxLines: 2, overflow: TextOverflow.ellipsis),
                                      const SizedBox(height: 6),
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                        Text(_fmtTL(item['priceKurus'] as int), style: TextStyle(fontWeight: FontWeight.bold, color: MettloColors.primary, fontSize: 15)),
                                        qty > 0
                                            ? Row(children: [
                                                IconButton(onPressed: () => cartNotifier.remove(item['id'] as String), icon: const Icon(Icons.remove_circle_outline), iconSize: 20, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                                                Padding(padding: const EdgeInsets.symmetric(horizontal: 6), child: Text('$qty', style: const TextStyle(fontWeight: FontWeight.w600))),
                                                IconButton(onPressed: () => cartNotifier.add(item), icon: const Icon(Icons.add_circle), color: MettloColors.primary, iconSize: 20, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                                              ])
                                            : ElevatedButton(
                                                onPressed: () => cartNotifier.add(item),
                                                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4), minimumSize: const Size(0, 30)),
                                                child: const Text('Ekle', style: TextStyle(fontSize: 12)),
                                              ),
                                      ]),
                                    ],
                                  )),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),

              // Sepete git butonu
              if (cartCount > 0)
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _showCartSheet(context, cart, cartNotifier, cartTotal),
                        icon: const Icon(Icons.shopping_cart),
                        label: Text('Sepet ($cartCount) — ${_fmtTL(cartTotal)}'),
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _showCartSheet(BuildContext context, List<Map<String, dynamic>> cart, CartNotifier notifier, int total) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: DraggableScrollableSheet(
            initialChildSize: 0.6,
            maxChildSize: 0.9,
            minChildSize: 0.4,
            expand: false,
            builder: (_, ctrl) => SingleChildScrollView(
              controller: ctrl,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Sepetim', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...cart.map((ci) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(ci['name'] as String),
                    subtitle: Text('${ci['qty']} × ${_fmtTL(ci['priceKurus'] as int)}'),
                    trailing: Text(_fmtTL((ci['priceKurus'] as int) * (ci['qty'] as int)), style: const TextStyle(fontWeight: FontWeight.w600)),
                  )),
                  const Divider(),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Toplam', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(_fmtTL(notifier.totalKurus), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ]),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _noteCtrl,
                    decoration: const InputDecoration(labelText: 'Not (isteğe bağlı)', border: OutlineInputBorder()),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 12),
                  if (_orderError != null) Text(_orderError!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _ordering ? null : () { Navigator.pop(ctx); _placeOrder(); },
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      child: _ordering ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Sipariş Ver', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CatChip extends StatelessWidget {
  const _CatChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: active ? MettloColors.primary : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(fontSize: 12, color: active ? Colors.white : Colors.black87, fontWeight: active ? FontWeight.w600 : FontWeight.normal)),
        ),
      );
}
