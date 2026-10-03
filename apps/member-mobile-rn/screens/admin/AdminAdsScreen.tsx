import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Ad {
  id: string;
  title: string;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'ENDED';
  imageUrl?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  advertiser?: { name: string; username: string };
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = { PENDING_REVIEW: 'İnceleniyor', ACTIVE: 'Aktif', REJECTED: 'Reddedildi', PAUSED: 'Duraklatıldı', ENDED: 'Bitti' };
const STATUS_COLOR: Record<string, string> = { PENDING_REVIEW: '#F59E0B', ACTIVE: '#10B981', REJECTED: '#EF4444', PAUSED: '#8B5CF6', ENDED: Colors.textMuted };
const FILTERS = ['İnceleniyor', 'Aktif', 'Reddedildi', 'Tümü'];
const FILTER_MAP: Record<string, string> = { 'İnceleniyor': 'PENDING_REVIEW', 'Aktif': 'ACTIVE', 'Reddedildi': 'REJECTED', 'Tümü': '' };

export function AdminAdsScreen() {
  const nav = useNavigation<Nav>();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('İnceleniyor');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const p: any = {};
      if (FILTER_MAP[f]) p.status = FILTER_MAP[f];
      const res = await api.get<{ data: Ad[] }>('/admin/ads', { params: p });
      setAds(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  async function approve(id: string) {
    setActionId(id);
    try {
      await api.patch(`/admin/ads/${id}`, { status: 'ACTIVE' });
      load(filter);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionId(null); }
  }

  async function reject(id: string) {
    Alert.prompt('Red Nedeni', 'Red gerekçesini girin:', async (reason) => {
      if (!reason?.trim()) return;
      setActionId(id);
      try {
        await api.patch(`/admin/ads/${id}`, { status: 'REJECTED', reason: reason.trim() });
        load(filter);
      } catch (e: any) {
        Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
      } finally { setActionId(null); }
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Reklamlar</MettloText>
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
          data={ads}
          keyExtractor={a => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>Reklam bulunamadı</MettloText>}
          renderItem={({ item: a }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                {a.imageUrl ? (
                  <Image source={{ uri: a.imageUrl }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]}><MettloText>📢</MettloText></View>
                )}
                <View style={styles.info}>
                  <MettloText style={styles.title}>{a.title}</MettloText>
                  {a.advertiser && <MettloText style={styles.sub}>{a.advertiser.name}</MettloText>}
                  {a.budget && <MettloText style={styles.budget}>Bütçe: {a.budget} ₺</MettloText>}
                </View>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[a.status]}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[a.status] }]}>{STATUS_LABEL[a.status]}</MettloText>
                </View>
              </View>
              {(a.startDate || a.endDate) && (
                <MettloText style={styles.dates}>
                  {a.startDate ? new Date(a.startDate).toLocaleDateString('tr-TR') : '?'} → {a.endDate ? new Date(a.endDate).toLocaleDateString('tr-TR') : '?'}
                </MettloText>
              )}
              {a.status === 'PENDING_REVIEW' && (
                <View style={styles.btnRow}>
                  <MettloButton label="✅ Onayla" onPress={() => approve(a.id)} loading={actionId === a.id} style={{ flex: 1 }} />
                  <MettloButton label="❌ Reddet" variant="danger" onPress={() => reject(a.id)} loading={actionId === a.id} style={{ flex: 1 }} />
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
  filters: { flexDirection: 'row', paddingHorizontal: Space.s16, paddingVertical: Space.s10, gap: Space.s8 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Space.s16, gap: Space.s12 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14, gap: Space.s10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  img: { width: 56, height: 56, borderRadius: Radius.md },
  imgPlaceholder: { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: Space.s4 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted },
  budget: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dates: { fontSize: 12, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Space.s10 },
});
