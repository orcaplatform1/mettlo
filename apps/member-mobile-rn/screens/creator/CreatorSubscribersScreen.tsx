import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_TR: Record<string, string> = { ACTIVE: 'Aktif', PAST_DUE: 'Gecikmeli', PAUSED: 'Duraklatıldı', CANCELLED: 'İptal', EXPIRED: 'Süresi Doldu' };
const STATUS_COLORS: Record<string, string> = { ACTIVE: Colors.success, PAST_DUE: Colors.warning, PAUSED: Colors.textMuted, CANCELLED: Colors.error, EXPIRED: Colors.textMuted };
const INTERVAL_TR: Record<string, string> = { MONTHLY: 'aylık', QUARTERLY: '3 aylık', BIANNUAL: '6 aylık', ANNUAL: 'yıllık' };
const fmtTL = (k: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(k);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('tr-TR');

export function CreatorSubscribersScreen() {
  const nav = useNavigation();
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['creator-subscribers'],
    queryFn: async () => {
      const res = await api.get('/coaching/subscriber-history');
      return res.data as any[];
    },
  });

  const active = history.filter(s => ['ACTIVE', 'PAST_DUE', 'PAUSED'].includes(s.status));
  const past = history.filter(s => ['CANCELLED', 'EXPIRED'].includes(s.status));
  const totalRevenue = history.reduce((sum, s) => sum + (s.totalPaid ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Abonelerim</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <>
          <View style={styles.stats}>
            <MettloText style={styles.statsText}>{active.length} aktif · {past.length} geçmiş</MettloText>
            <MettloText style={styles.statsText}>Toplam gelir: <MettloText style={{ color: Colors.primary, fontWeight: '700' }}>{fmtTL(totalRevenue)} ₺</MettloText></MettloText>
          </View>

          {history.length === 0 ? (
            <MettloEmptyState title="Henüz abonen yok" description="Abonelik planı oluşturursan abone alabilirsin" />
          ) : (
            <FlatList
              data={history}
              keyExtractor={s => s.id}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item: s }) => (
                <View style={styles.row}>
                  <MettloAvatar uri={s.member?.avatarUrl} name={s.member?.name} size={40} />
                  <View style={{ flex: 1 }}>
                    <MettloText style={{ fontWeight: '600' }}>{s.member?.name}</MettloText>
                    <MettloText style={styles.caption}>@{s.member?.username} · {INTERVAL_TR[s.interval] ?? s.interval}</MettloText>
                    <MettloText style={styles.caption}>Başlangıç: {fmtDate(s.startedAt)} · Ödenen: {fmtTL(s.totalPaid ?? 0)} ₺</MettloText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[s.status] ?? Colors.textMuted}20` }]}>
                    <MettloText style={[styles.badgeText, { color: STATUS_COLORS[s.status] ?? Colors.textMuted }]}>{STATUS_TR[s.status] ?? s.status}</MettloText>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  stats: { paddingHorizontal: Space.s16, paddingVertical: Space.s10, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s4 },
  statsText: { fontSize: 13, color: Colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
