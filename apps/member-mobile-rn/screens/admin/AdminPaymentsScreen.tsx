import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface FinanceSummary {
  totalRevenue: number;
  totalPayouts: number;
  netRevenue: number;
  activeSubscriptions: number;
  mrr: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  user?: { name: string; username: string };
}

function fmt(n: number, cur = 'TRY') {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

export function AdminPaymentsScreen() {
  const nav = useNavigation<Nav>();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const [finRes, payRes] = await Promise.all([
        api.get<FinanceSummary>('/admin/finance'),
        api.get<{ data: Payment[] }>('/admin/finance/payments'),
      ]);
      setSummary(finRes.data);
      setPayments(payRes.data.data ?? (payRes.data as any));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STATUS_COLOR: Record<string, string> = { COMPLETED: '#10B981', PENDING: '#F59E0B', FAILED: '#EF4444', REFUNDED: '#8B5CF6' };
  const STATUS_LABEL: Record<string, string> = { COMPLETED: 'Tamamlandı', PENDING: 'Bekliyor', FAILED: 'Başarısız', REFUNDED: 'İade' };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Ödemeler & Finans</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
          ListHeaderComponent={summary ? (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <MettloText style={styles.summaryValue}>{fmt(summary.totalRevenue)}</MettloText>
                <MettloText style={styles.summaryLabel}>Toplam Gelir</MettloText>
              </View>
              <View style={styles.summaryCard}>
                <MettloText style={styles.summaryValue}>{fmt(summary.netRevenue)}</MettloText>
                <MettloText style={styles.summaryLabel}>Net Gelir</MettloText>
              </View>
              <View style={styles.summaryCard}>
                <MettloText style={styles.summaryValue}>{fmt(summary.mrr)}</MettloText>
                <MettloText style={styles.summaryLabel}>MRR</MettloText>
              </View>
              <View style={styles.summaryCard}>
                <MettloText style={styles.summaryValue}>{summary.activeSubscriptions}</MettloText>
                <MettloText style={styles.summaryLabel}>Aktif Abonelik</MettloText>
              </View>
            </View>
          ) : null}
          ListEmptyComponent={<MettloText style={styles.empty}>Ödeme bulunamadı</MettloText>}
          renderItem={({ item: p }) => (
            <View style={styles.payRow}>
              <View style={styles.payInfo}>
                <MettloText style={styles.payType}>{p.type}</MettloText>
                {p.user && <MettloText style={styles.payUser}>{p.user.name} · @{p.user.username}</MettloText>}
                <MettloText style={styles.payDate}>{new Date(p.createdAt).toLocaleDateString('tr-TR')}</MettloText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <MettloText style={styles.payAmount}>{fmt(p.amount, p.currency)}</MettloText>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[p.status] ?? Colors.textMuted}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[p.status] ?? Colors.textMuted }]}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </MettloText>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Space.s16, gap: Space.s12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s10, marginBottom: Space.s8 },
  summaryCard: { width: '47%', backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14, gap: Space.s4 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  summaryLabel: { fontSize: 12, color: Colors.textMuted },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface1, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14 },
  payInfo: { gap: Space.s2 },
  payType: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  payUser: { fontSize: 12, color: Colors.textMuted },
  payDate: { fontSize: 12, color: Colors.textMuted },
  payAmount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
