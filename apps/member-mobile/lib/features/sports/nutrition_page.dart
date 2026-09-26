import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final nutritionProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async =>
    await ref.watch(apiClientProvider).get('/nutrition/overview') as Map<String, dynamic>);

class NutritionPage extends ConsumerStatefulWidget {
  const NutritionPage({super.key});
  @override
  ConsumerState<NutritionPage> createState() => _NutritionPageState();
}

class _NutritionPageState extends ConsumerState<NutritionPage> {
  final _food = TextEditingController();
  final _cal = TextEditingController();
  final _pro = TextEditingController();
  final _carb = TextEditingController();
  final _fat = TextEditingController();
  final _water = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _food.dispose();
    _cal.dispose();
    _pro.dispose();
    _carb.dispose();
    _fat.dispose();
    _water.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    if (_food.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Besin adı giriniz.')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).post('/nutrition/log', body: {
        'foodName': _food.text.trim(),
        if (_cal.text.isNotEmpty) 'calories': int.tryParse(_cal.text) ?? 0,
        if (_pro.text.isNotEmpty)
          'proteinG': double.tryParse(_pro.text) ?? 0,
        if (_carb.text.isNotEmpty)
          'carbG': double.tryParse(_carb.text) ?? 0,
        if (_fat.text.isNotEmpty)
          'fatG': double.tryParse(_fat.text) ?? 0,
        if (_water.text.isNotEmpty)
          'waterMl': int.tryParse(_water.text) ?? 0,
        'date': DateTime.now().toIso8601String().substring(0, 10),
        'mealType': 'SNACK',
      });
      ref.invalidate(nutritionProvider);
      _food.clear();
      _cal.clear();
      _pro.clear();
      _carb.clear();
      _fat.clear();
      _water.clear();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Besin kaydedildi!')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ov = ref.watch(nutritionProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Beslenme Günlüğü')),
      body: RefreshIndicator(
        color: MettloColors.primary,
        onRefresh: () async => ref.invalidate(nutritionProvider),
        child: ListView(padding: const EdgeInsets.all(16), children: [
          AsyncBody(
            value: ov,
            onRetry: () => ref.invalidate(nutritionProvider),
            builder: (o) {
              final t = o['todayTotals'] as Map<String, dynamic>? ?? {};
              return GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.8,
                children: [
                  StatTile(
                      icon: Icons.local_fire_department,
                      value: '${t['calories'] ?? 0}',
                      label: 'Bugün kalori'),
                  StatTile(
                      icon: Icons.egg_outlined,
                      value: '${t['proteinG'] ?? 0}g',
                      label: 'Protein'),
                  StatTile(
                      icon: Icons.grain,
                      value: '${t['carbG'] ?? 0}g',
                      label: 'Karbonhidrat'),
                  StatTile(
                      icon: Icons.water_drop_outlined,
                      value: '${t['waterMl'] ?? 0}ml',
                      label: 'Su'),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Öğün / Besin Ekle',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 12),
                TextField(
                    controller: _food,
                    decoration: const InputDecoration(labelText: 'Besin adı')),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _cal,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Kalori'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _pro,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Protein (g)'),
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _carb,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Karb (g)'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _fat,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Yağ (g)'),
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                TextField(
                  controller: _water,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Su (ml, isteğe bağlı)'),
                ),
                const SizedBox(height: 12),
                MettloButton(label: 'Kaydet', loading: _busy, onPressed: _add),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
