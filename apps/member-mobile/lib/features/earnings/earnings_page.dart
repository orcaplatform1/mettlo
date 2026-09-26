import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';

// ── Providers ────────────────────────────────────────────────────────────────

final earningsBalanceProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('/earnings');
  return Map<String, dynamic>.from(res.data as Map);
});

final earningsHistoryProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('/earnings/history?limit=15');
  return (res.data['items'] as List?) ?? [];
});

final payoutAccountsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('/payout-accounts');
  return (res.data as List?) ?? [];
});

final payoutsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('/payouts?limit=10');
  return (res.data['items'] as List?) ?? [];
});

// ── Sayfa ────────────────────────────────────────────────────────────────────

class EarningsPage extends ConsumerWidget {
  const EarningsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceAsync = ref.watch(earningsBalanceProvider);
    final historyAsync = ref.watch(earningsHistoryProvider);
    final accountsAsync = ref.watch(payoutAccountsProvider);
    final payoutsAsync = ref.watch(payoutsProvider);
    final theme = Theme.of(context);

    String fmt(num val) => '₺${val.toStringAsFixed(2)}';

    return Scaffold(
      appBar: AppBar(title: const Text('Kazançlarım')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(earningsBalanceProvider);
          ref.invalidate(earningsHistoryProvider);
          ref.invalidate(payoutAccountsProvider);
          ref.invalidate(payoutsProvider);
        },
        child: balanceAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Yüklenemedi: $e')),
          data: (balance) {
            final available = (balance['available'] as num?) ?? 0;
            final pending = (balance['pending'] as num?) ?? 0;
            final total = (balance['totalEarnings'] as num?) ?? 0;
            final paidOut = (balance['totalPaidOut'] as num?) ?? 0;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Bakiye kartları
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.0,
                  children: [
                    _BalanceTile(label: 'Toplam Kazanç', value: fmt(total), color: Colors.blue),
                    _BalanceTile(label: 'Bekleyen', value: fmt(pending), color: Colors.orange),
                    _BalanceTile(label: 'Çekilebilir', value: fmt(available), color: Colors.green),
                    _BalanceTile(label: 'Toplam Ödenen', value: fmt(paidOut), color: Colors.purple),
                  ],
                ),
                const SizedBox(height: 20),

                // Para çekme butonu
                accountsAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (accounts) {
                    final activeAccount = accounts.where((a) => a['isActive'] == true && a['status'] == 'VERIFIED').firstOrNull;
                    if (activeAccount == null) {
                      return OutlinedButton.icon(
                        onPressed: () => Navigator.of(context).pushNamed('/earnings/add-bank'),
                        icon: const Icon(Icons.account_balance),
                        label: const Text('Banka Hesabı Ekle'),
                      );
                    }
                    return _PayoutRequestCard(
                      availableKurus: (available * 100).round(),
                      account: activeAccount as Map<String, dynamic>,
                      onSuccess: () {
                        ref.invalidate(earningsBalanceProvider);
                        ref.invalidate(payoutsProvider);
                      },
                    );
                  },
                ),
                const SizedBox(height: 20),

                // Son para çekme işlemleri
                payoutsAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (payouts) {
                    if (payouts.isEmpty) return const SizedBox.shrink();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Para Çekme Geçmişi', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        ...payouts.map((p) => _PayoutRow(payout: p as Map<String, dynamic>)),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 20),

                // Kazanç geçmişi
                historyAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (items) {
                    if (items.isEmpty) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Text('Henüz kazanç yok.', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey)),
                        ),
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Son Kazançlar', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        ...items.map((e) => _EarningRow(earning: e as Map<String, dynamic>)),
                      ],
                    );
                  },
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ── Yardımcı widget'lar ───────────────────────────────────────────────────────

class _BalanceTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _BalanceTile({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}

class _PayoutRow extends StatelessWidget {
  final Map<String, dynamic> payout;
  const _PayoutRow({required this.payout});

  @override
  Widget build(BuildContext context) {
    final status = payout['status'] as String? ?? '';
    final statusColors = {
      'PENDING': Colors.orange,
      'PROCESSING': Colors.blue,
      'PAID': Colors.green,
      'FAILED': Colors.red,
      'RETURNED': Colors.red,
      'CANCELLED': Colors.grey,
    };
    final statusTR = {
      'PENDING': 'Bekliyor', 'PROCESSING': 'İşleniyor', 'PAID': 'Ödendi',
      'FAILED': 'Başarısız', 'RETURNED': 'İade', 'CANCELLED': 'İptal',
    };
    final amountKurus = (payout['amountKurus'] as num?) ?? 0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('₺${(amountKurus / 100).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(payout['maskedIban'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: (statusColors[status] ?? Colors.grey).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(statusTR[status] ?? status, style: TextStyle(fontSize: 12, color: statusColors[status] ?? Colors.grey, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _EarningRow extends StatelessWidget {
  final Map<String, dynamic> earning;
  const _EarningRow({required this.earning});

  @override
  Widget build(BuildContext context) {
    final share = (earning['creatorShare'] as num?) ?? 0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('₺${share.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                Text('${earning['type']} · ${earning['period']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          if (earning['commissionRate'] != null)
            Text('%${earning['commissionRate']} komisyon', style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}

// ── Para çekme formu ─────────────────────────────────────────────────────────

class _PayoutRequestCard extends ConsumerStatefulWidget {
  final int availableKurus;
  final Map<String, dynamic> account;
  final VoidCallback onSuccess;

  const _PayoutRequestCard({
    required this.availableKurus,
    required this.account,
    required this.onSuccess,
  });

  @override
  ConsumerState<_PayoutRequestCard> createState() => _PayoutRequestCardState();
}

class _PayoutRequestCardState extends ConsumerState<_PayoutRequestCard> {
  final _ctrl = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final tl = double.tryParse(_ctrl.text.replaceAll(',', '.'));
    if (tl == null || tl < 10) { setState(() => _error = 'Minimum 10 TL çekebilirsiniz.'); return; }
    final kurus = (tl * 100).round();
    if (kurus > widget.availableKurus) { setState(() => _error = 'Çekilebilir bakiyenizi aşıyor.'); return; }
    setState(() { _error = null; _loading = true; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/payouts', data: {'amountKurus': kurus, 'payoutAccountId': widget.account['id']});
      _ctrl.clear();
      widget.onSuccess();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Para çekme talebiniz alındı.')));
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final availableTL = widget.availableKurus / 100;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Para Çek', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.account_balance, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.account['accountHolderName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      Text(widget.account['maskedIban'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ctrl,
              decoration: InputDecoration(
                labelText: 'Tutar (TL)',
                hintText: '0,00',
                helperText: 'Çekilebilir: ₺${availableTL.toStringAsFixed(2)}',
                prefixText: '₺ ',
                errorText: _error,
                border: const OutlineInputBorder(),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                TextButton(
                  onPressed: () => _ctrl.text = availableTL.toStringAsFixed(2),
                  child: const Text('Tümü'),
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: _loading || widget.availableKurus < 1000 ? null : _submit,
                  child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Para Çek'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
