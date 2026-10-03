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

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidOut: number;
  thisMonth: number;
  lastMonth: number;
  commissionRate?: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  description?: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

export function CreatorEarningsScreen() {
  const nav = useNavigation<Nav>();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const [sumRes, txRes] = await Promise.all([
        api.get<EarningsSummary>('/me/earnings'),
        api.get<{ data: Transaction[] }>('/me/earnings/transactions'),
      ]);
      setSummary(sumRes.data);
      setTransactions(txRes.data.data ?? (txRes.data as any));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STATUS_COLOR: Record<string, string> = { PAID: '#10B981', PENDING: '#F59E0B', CANCELLED: '#EF4444' };
  const STATUS_LABEL: Record<string, string> = { PAID: 'Ödendi', PENDING: 'Bekliyor', CANCELLED: 'İptal' };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Kazançlarım</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
          ListHeaderComponent={summary ? (
            <View style={styles.summarySection}>
              <View style={styles.mainCard}>
                <MettloText style={styles.mainLabel}>Toplam Kazanç</MettloText>
                <MettloText style={styles.mainValue}>{fmt(summary.totalEarnings)}</MettloText>
                {summary.commissionRate && (
                  <MettloText style={styles.commission}>Komisyon oranı: %{((1 - summary.commissionRate) * 100).toFixed(0)}</MettloText>
                )}
              </View>
              <View style={styles.grid}>
                <View style={styles.gridCard}>
                  <MettloText style={styles.gridValue}>{fmt(summary.pendingEarnings)}</MettloText>
                  <MettloText style={styles.gridLabel}>Bekleyen</MettloText>
                </View>
                <View style={styles.gridCard}>
                  <MettloText style={styles.gridValue}>{fmt(summary.paidOut)}</MettloText>
                  <MettloText style={styles.gridLabel}>Ödenen</MettloText>
                </View>
                <View style={styles.gridCard}>
                  <MettloText style={styles.gridValue}>{fmt(summary.thisMonth)}</MettloText>
                  <MettloText style={styles.gridLabel}>Bu Ay</MettloText>
                </View>
                <View style={styles.gridCard}>
                  <MettloText style={styles.gridValue}>{fmt(summary.lastMonth)}</MettloText>
                  <MettloText style={styles.gridLabel}>Geçen Ay</MettloText>
                </View>
              </View>
              <MettloText variant="caption" color={Colors.textMuted} style={{ letterSpacing: 0.5 }}>İŞLEM GEÇMİŞİ</MettloText>
            </View>
          ) : null}
          ListEmptyComponent={<MettloText style={styles.empty}>Henüz işlem yok</MettloText>}
          renderItem={({ item: t }) => (
            <View style={styles.txRow}>
              <View style={styles.txInfo}>
                <MettloText style={styles.txType}>{t.description ?? t.type}</MettloText>
                <MettloText style={styles.txDate}>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</MettloText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <MettloText style={[styles.txAmount, { color: t.status === 'PAID' ? Colors.primary : Colors.textPrimary }]}>
                  +{fmt(t.amount)}
                </MettloText>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[t.status]}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[t.status] }]}>{STATUS_LABEL[t.status]}</MettloText>
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
  summarySection: { gap: Space.s12, marginBottom: Space.s8 },
  mainCard: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s20, alignItems: 'center', gap: Space.s4 },
  mainLabel: { fontSize: 13, color: Colors.textMuted },
  mainValue: { fontSize: 36, fontWeight: '900', color: Colors.primary },
  commission: { fontSize: 12, color: Colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s10 },
  gridCard: { width: '47%', backgroundColor: Colors.surface1, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14, gap: Space.s2 },
  gridValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  gridLabel: { fontSize: 12, color: Colors.textMuted },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  txRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface1, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14 },
  txInfo: { gap: Space.s2 },
  txType: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txDate: { fontSize: 12, color: Colors.textMuted },
  txAmount: { fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
