import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface CreatorStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalClients: number;
  activeClients: number;
  totalSessions: number;
  rating?: number;
  reviewCount?: number;
  pendingReservations?: number;
  publishedPrograms?: number;
}

function StatCard({ label, value, sub, onPress }: { label: string; value: string | number; sub?: string; onPress?: () => void }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={styles.statCard} onPress={onPress} activeOpacity={0.75}>
      <MettloText style={styles.statValue}>{value}</MettloText>
      <MettloText style={styles.statLabel}>{label}</MettloText>
      {sub && <MettloText style={styles.statSub}>{sub}</MettloText>}
    </Wrap>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

export function CreatorDashboardScreen() {
  const nav = useNavigation<Nav>();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get<CreatorStats>('/me/creator-stats');
      setStats(res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const menuItems = [
    { icon: '👥', label: 'Danışanlarım', onPress: () => nav.navigate('CreatorClients') },
    { icon: '💰', label: 'Kazançlarım', onPress: () => nav.navigate('CreatorEarnings') },
    { icon: '📋', label: 'Programlarım', onPress: () => nav.navigate('CreatorPrograms') },
    { icon: '📅', label: 'Rezervasyonlarım', onPress: () => nav.navigate('Reservations') },
    { icon: '📡', label: 'Canlı Yayın', onPress: () => nav.navigate('Live') },
    { icon: '🏆', label: 'Challenge\'larım', onPress: () => nav.navigate('Challenges') },
    { icon: '💬', label: 'Mesajlarım', onPress: () => nav.navigate('Messages') },
    { icon: '⚙️', label: 'Profil Ayarları', onPress: () => nav.navigate('CreatorSettings') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Koç Paneli</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
        ) : stats ? (
          <View style={styles.statsGrid}>
            <StatCard label="Toplam Kazanç" value={fmt(stats.totalEarnings)} onPress={() => nav.navigate('CreatorEarnings')} />
            <StatCard label="Bekleyen Kazanç" value={fmt(stats.pendingEarnings)} onPress={() => nav.navigate('CreatorEarnings')} />
            <StatCard label="Aktif Danışan" value={stats.activeClients} sub={`/ ${stats.totalClients} toplam`} onPress={() => nav.navigate('CreatorClients')} />
            {stats.rating && <StatCard label="Puan" value={`⭐ ${stats.rating.toFixed(1)}`} sub={`${stats.reviewCount ?? 0} değerlendirme`} />}
            {stats.pendingReservations != null && <StatCard label="Bekleyen Rezervasyon" value={stats.pendingReservations} onPress={() => nav.navigate('Reservations')} />}
            {stats.publishedPrograms != null && <StatCard label="Aktif Program" value={stats.publishedPrograms} onPress={() => nav.navigate('CreatorPrograms')} />}
          </View>
        ) : null}

        <View style={styles.section}>
          <MettloText variant="caption" color={Colors.textMuted} style={styles.sectionTitle}>KOÇ MENÜsÜ</MettloText>
          {menuItems.map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <MettloText style={styles.menuIcon}>{item.icon}</MettloText>
              <MettloText variant="body" style={styles.menuLabel}>{item.label}</MettloText>
              <MettloText color={Colors.textMuted}>›</MettloText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { alignItems: 'center', justifyContent: 'center', padding: Space.s32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s10, padding: Space.s16 },
  statCard: { width: '47%', backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14, gap: Space.s4 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  statSub: { fontSize: 11, color: Colors.borderSubtle },
  section: { marginTop: Space.s8 },
  sectionTitle: { paddingHorizontal: Space.s20, paddingBottom: Space.s8, letterSpacing: 1, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s20, paddingVertical: Space.s16, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s14 },
  menuIcon: { fontSize: 22, width: 30 },
  menuLabel: { flex: 1 },
});
