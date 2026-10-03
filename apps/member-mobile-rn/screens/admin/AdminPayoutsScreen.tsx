import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_TR: Record<string, string> = { PENDING: 'Bekliyor', PROCESSING: 'İşleniyor', PAID: 'Ödendi', FAILED: 'Başarısız', RETURNED: 'İade', CANCELLED: 'İptal' };
const STATUS_COLORS: Record<string, string> = { PENDING: Colors.warning, PROCESSING: Colors.primary, PAID: Colors.success, FAILED: Colors.error, RETURNED: Colors.error, CANCELLED: Colors.textMuted };
const TABS = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'RETURNED', 'CANCELLED'];
const TAB_TR: Record<string, string> = { PENDING: 'Bekleyen', PROCESSING: 'İşleniyor', PAID: 'Ödendi', FAILED: 'Başarısız', RETURNED: 'İade', CANCELLED: 'İptal' };

const fmtTL = (k: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(k / 100);

export function AdminPayoutsScreen() {
  const nav = useNavigation();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ items: any[]; total: number }>('/admin/payouts', { params: { status: s, limit: 30 } });
      setPayouts(res.data?.items ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(status); }, [status]);

  async function approvePayout(id: string) {
    Alert.alert('Ödemeyi Onayla', 'Bu ödeme talebini onaylamak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Onayla', onPress: async () => {
        try {
          await api.post(`/admin/payouts/${id}/approve`);
          setPayouts(prev => prev.filter(p => p.id !== id));
        } catch {}
      }},
    ]);
  }

  async function cancelPayout(id: string) {
    Alert.alert('Talebi İptal Et', 'Bu ödeme talebini iptal etmek istiyor musun?', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'İptal Et', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/admin/payouts/${id}/cancel`);
          setPayouts(prev => prev.filter(p => p.id !== id));
        } catch {}
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Para Çekme</MettloText>
        <MettloText style={styles.total}>{total}</MettloText>
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, status === t && styles.tabActive]} onPress={() => setStatus(t)}>
            <MettloText style={[styles.tabText, status === t && styles.tabTextActive] as any}>{TAB_TR[t]}</MettloText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={payouts}
          keyExtractor={p => p.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<MettloText style={styles.empty}>Bu durumda talep yok</MettloText>}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <MettloText style={{ fontWeight: '700' }}>{p.user?.name ?? p.user?.username}</MettloText>
                    <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[p.status] ?? Colors.textMuted}20` }]}>
                      <MettloText style={[styles.badgeText, { color: STATUS_COLORS[p.status] ?? Colors.textMuted }]}>{STATUS_TR[p.status]}</MettloText>
                    </View>
                  </View>
                  <MettloText style={styles.caption}>@{p.user?.username} · {p.accountType}</MettloText>
                  <MettloText style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 }}>{fmtTL(p.amountKurus)}</MettloText>
                  <MettloText style={styles.caption}>IBAN: {p.maskedIban}</MettloText>
                  <MettloText style={styles.caption}>Hesap Sahibi: {p.accountHolderName}</MettloText>
                  {p.failureReason && <MettloText style={[styles.caption, { color: Colors.error }]}>Hata: {p.failureReason}</MettloText>}
                  <MettloText style={styles.caption}>{new Date(p.createdAt).toLocaleString('tr-TR')}</MettloText>
                </View>
              </View>
              {(status === 'PENDING' || status === 'PROCESSING') && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => approvePayout(p.id)}>
                    <MettloText style={{ fontSize: 13, color: Colors.success, fontWeight: '600' }}>Onayla</MettloText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelPayout(p.id)}>
                    <MettloText style={{ fontSize: 13, color: Colors.error }}>İptal</MettloText>
                  </TouchableOpacity>
                </View>
              )}
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
  total: { fontSize: 13, color: Colors.textMuted },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Space.s16, gap: Space.s8, paddingVertical: Space.s10 },
  tab: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textMuted },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: Space.s12, marginTop: Space.s12, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle },
  cardRow: { gap: Space.s4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s8 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: Space.s10, marginTop: Space.s12 },
  approveBtn: { flex: 1, paddingVertical: Space.s8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.success, alignItems: 'center' },
  cancelBtn: { flex: 1, paddingVertical: Space.s8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error, alignItems: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
