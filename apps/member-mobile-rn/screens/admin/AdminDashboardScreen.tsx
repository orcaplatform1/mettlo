import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Stats {
  pendingCreators: number;
  openTickets: number;
  answeredTickets: number;
  openReports: number;
  activeSubscriptions: number;
  newUsers7: number;
  activeCreators: number;
  publishedProducts: number;
  pendingBusinessVerifications?: number;
  pendingAds?: number;
  onlineNow?: number;
  onlineMembers?: number;
}

interface StatCard {
  icon: React.ReactNode;
  value: number;
  label: string;
  onPress?: () => void;
  alert?: boolean;
}

function StatTile({ icon, value, label, onPress, alert }: StatCard) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      style={[styles.tile, alert && value > 0 && styles.tileAlert]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.tileIcon}>{icon}</View>
      <MettloText style={[styles.tileValue, alert && value > 0 && styles.tileValueAlert] as any}>{value}</MettloText>
      <MettloText style={styles.tileLabel}>{label}</MettloText>
    </Wrap>
  );
}

function Icon({ name }: { name: string }) {
  const col = Colors.primary;
  switch (name) {
    case 'users': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={col} strokeWidth={1.8} strokeLinecap="round"/><Circle cx="9" cy="7" r="4" stroke={col} strokeWidth={1.8}/><Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={col} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
    case 'check': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M9 11l3 3L22 4" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
    case 'ticket': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><Path d="M14 2v6h6M8 13h8M8 17h5" stroke={col} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
    case 'flag': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={Colors.error} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><Path d="M4 22V15" stroke={Colors.error} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
    case 'globe': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={col} strokeWidth={1.8}/><Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={col} strokeWidth={1.8}/></Svg>;
    case 'package': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><Path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" stroke={col} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
    case 'megaphone': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="m3 11 19-9-9 19-2-8-8-2z" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
    case 'store': return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><Path d="M9 22V12h6v10" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
    default: return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={col} strokeWidth={1.8}/></Svg>;
  }
}

export function AdminDashboardScreen() {
  const nav = useNavigation<Nav>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get<Stats>('/admin/stats');
      setStats(res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tiles: StatCard[] = stats ? [
    { icon: <Icon name="globe" />, value: stats.onlineNow ?? 0, label: 'Şu an sitede (ziyaretçi)' },
    { icon: <Icon name="users" />, value: stats.onlineMembers ?? 0, label: 'Şu an sitede (üye)' },
    { icon: <Icon name="check" />, value: stats.pendingCreators, label: 'Onay bekleyen koç', alert: true, onPress: () => nav.navigate('AdminCoaches', { filter: 'PENDING' }) },
    { icon: <Icon name="ticket" />, value: stats.openTickets, label: `Açık destek bileti (${stats.answeredTickets} yanıtlandı)`, alert: true, onPress: () => nav.navigate('AdminTickets', { filter: 'OPEN' }) },
    { icon: <Icon name="flag" />, value: stats.openReports, label: 'Açık şikâyet', alert: true, onPress: () => nav.navigate('AdminReports') },
    { icon: <Icon name="users" />, value: stats.activeSubscriptions, label: 'Aktif abonelik' },
    { icon: <Icon name="users" />, value: stats.newUsers7, label: 'Son 7 gün yeni üye', onPress: () => nav.navigate('AdminUsers') },
    { icon: <Icon name="check" />, value: stats.activeCreators, label: 'Yayındaki koç', onPress: () => nav.navigate('AdminCoaches', { filter: 'APPROVED' }) },
    { icon: <Icon name="package" />, value: stats.publishedProducts, label: 'Yayındaki ürün', onPress: () => nav.navigate('AdminStore') },
    ...(stats.pendingBusinessVerifications != null ? [{ icon: <Icon name="store" />, value: stats.pendingBusinessVerifications, label: 'Bekleyen işletme doğrulama', alert: true, onPress: () => nav.navigate('AdminBusinesses') }] : []),
    ...(stats.pendingAds != null ? [{ icon: <Icon name="megaphone" />, value: stats.pendingAds, label: 'İnceleme bekleyen reklam', alert: true, onPress: () => nav.navigate('AdminAds') }] : []),
  ] : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Genel Bakış</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        >
          <View style={styles.grid}>
            {tiles.map((t) => (
              <StatTile key={t.label} {...t} />
            ))}
          </View>
          <MettloText style={styles.note}>Yalnızca toplu istatistikler gösterilir. Kişisel veriler yalnızca süper admin tarafından görüntülenir.</MettloText>

          <MettloText style={styles.sectionTitle}>HIZLI ERİŞİM</MettloText>
          <View style={styles.menuList}>
            {([
              ['👥', 'Kullanıcılar', () => nav.navigate('AdminUsers')],
              ['✅', 'Koç Onayları', () => nav.navigate('AdminCoaches', { filter: 'PENDING' })],
              ['🚩', 'Şikâyetler', () => nav.navigate('AdminReports')],
              ['🎫', 'Destek Biletleri', () => nav.navigate('AdminTickets', { filter: 'OPEN' })],
              ['⭐', 'Değerlendirmeler', () => nav.navigate('AdminReviews')],
              ['💳', 'Ödemeler & Finans', () => nav.navigate('AdminPayments')],
              ['💸', 'Ödeme Talepleri', () => nav.navigate('AdminPayouts')],
              ['🛒', 'Mağaza', () => nav.navigate('AdminStore')],
              ['🏢', 'İşletmeler', () => nav.navigate('AdminBusinesses')],
              ['📢', 'Reklamlar', () => nav.navigate('AdminAds')],
              ['🎪', 'Etkinlikler', () => nav.navigate('AdminEvents')],
              ['👔', 'İş İlanları', () => nav.navigate('AdminJobs')],
              ['💼', 'Kariyer Başvuruları', () => nav.navigate('AdminCareers')],
              ['📬', 'İletişim Mesajları', () => nav.navigate('AdminContact')],
              ['👮', 'Roller & Yetkiler', () => nav.navigate('AdminRoles')],
              ['📸', 'Hikâyeler', () => nav.navigate('AdminStories')],
              ['🌿', 'Spor Branşları', () => nav.navigate('AdminBranches')],
              ['🏷️', 'Alt Kategoriler', () => nav.navigate('AdminSubCategories')],
              ['💹', 'Komisyon Ayarları', () => nav.navigate('AdminCommission')],
              ['🔧', 'Platform Özellikleri', () => nav.navigate('AdminFeatures')],
              ['📋', 'Denetim Logları', () => nav.navigate('AdminAudit')],
            ] as [string, string, () => void][]).map(([icon, label, onPress]) => (
              <TouchableOpacity key={label} style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
                <MettloText style={styles.menuIcon}>{icon}</MettloText>
                <MettloText style={styles.menuLabel}>{label}</MettloText>
                <MettloText style={{ color: Colors.textMuted }}>›</MettloText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Space.s16, gap: Space.s16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s12 },
  tile: { width: '47%', backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s6 },
  tileAlert: { borderColor: 'rgba(248,113,113,0.4)' },
  tileIcon: {},
  tileValue: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  tileValueAlert: { color: Colors.error },
  tileLabel: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  note: { fontSize: 12, color: Colors.textMuted, lineHeight: 17, textAlign: 'center', paddingHorizontal: Space.s8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginTop: Space.s8, marginBottom: Space.s4 },
  menuList: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  menuIcon: { fontSize: 18, width: 26 },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
});
