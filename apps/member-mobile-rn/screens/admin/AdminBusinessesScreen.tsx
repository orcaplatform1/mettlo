import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Business {
  id: string;
  name: string;
  category?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  city?: string;
  owner?: { name: string; username: string };
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Bekliyor', ACTIVE: 'Aktif', SUSPENDED: 'Askıda' };
const STATUS_COLOR: Record<string, string> = { PENDING: '#F59E0B', ACTIVE: '#10B981', SUSPENDED: '#EF4444' };
const FILTERS = ['Tümü', 'Bekleyen', 'Aktif', 'Askıda'];
const FILTER_MAP: Record<string, string> = { 'Tümü': '', 'Bekleyen': 'PENDING', 'Aktif': 'ACTIVE', 'Askıda': 'SUSPENDED' };

export function AdminBusinessesScreen() {
  const nav = useNavigation<Nav>();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tümü');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const p: any = {};
      if (FILTER_MAP[f]) p.status = FILTER_MAP[f];
      const res = await api.get<{ data: Business[] }>('/admin/businesses', { params: p });
      setBusinesses(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  async function approve(b: Business) {
    setActionId(b.id);
    try {
      await api.patch(`/admin/businesses/${b.id}`, { status: 'ACTIVE' });
      load(filter);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionId(null); }
  }

  async function suspend(b: Business) {
    setActionId(b.id);
    try {
      await api.patch(`/admin/businesses/${b.id}`, { status: 'SUSPENDED' });
      load(filter);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionId(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">İşletmeler</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <MettloText style={[styles.chipText, filter === f && styles.chipTextActive] as any}>{f}</MettloText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={b => b.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>İşletme bulunamadı</MettloText>}
          renderItem={({ item: b }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.info}>
                  <MettloText style={styles.name}>{b.name}</MettloText>
                  {b.category && <MettloText style={styles.sub}>{b.category}</MettloText>}
                  {b.city && <MettloText style={styles.sub}>{b.city}</MettloText>}
                  {b.owner && <MettloText style={styles.sub}>Sahip: {b.owner.name} · @{b.owner.username}</MettloText>}
                </View>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[b.status]}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[b.status] }]}>{STATUS_LABEL[b.status]}</MettloText>
                </View>
              </View>
              <MettloText style={styles.date}>{new Date(b.createdAt).toLocaleDateString('tr-TR')}</MettloText>
              <View style={styles.btnRow}>
                {b.status !== 'ACTIVE' && <MettloButton label="✅ Onayla" onPress={() => approve(b)} loading={actionId === b.id} style={{ flex: 1 }} />}
                {b.status === 'ACTIVE' && <MettloButton label="⏸ Askıya Al" variant="danger" onPress={() => suspend(b)} loading={actionId === b.id} style={{ flex: 1 }} />}
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
  filters: { flexDirection: 'row', paddingHorizontal: Space.s16, paddingVertical: Space.s10, gap: Space.s8 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Space.s16, gap: Space.s12 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  info: { flex: 1, gap: Space.s4 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Space.s10 },
});
