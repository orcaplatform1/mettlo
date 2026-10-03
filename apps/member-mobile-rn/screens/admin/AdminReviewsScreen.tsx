import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Review {
  id: string;
  rating: number;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewer: { name: string; username: string; avatarUrl?: string };
  coach?: { name: string; username: string };
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Bekliyor', APPROVED: 'Onaylı', REJECTED: 'Reddedildi' };
const STATUS_COLOR: Record<string, string> = { PENDING: '#F59E0B', APPROVED: '#10B981', REJECTED: '#EF4444' };
const FILTERS = ['Bekleyen', 'Onaylı', 'Reddedildi', 'Tümü'];
const FILTER_MAP: Record<string, string> = { 'Bekleyen': 'PENDING', 'Onaylı': 'APPROVED', 'Reddedildi': 'REJECTED', 'Tümü': '' };

function Stars({ rating }: { rating: number }) {
  return <MettloText style={{ fontSize: 14 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</MettloText>;
}

export function AdminReviewsScreen() {
  const nav = useNavigation<Nav>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Bekleyen');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const p: any = {};
      if (FILTER_MAP[f]) p.status = FILTER_MAP[f];
      const res = await api.get<{ data: Review[] }>('/admin/reviews', { params: p });
      setReviews(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  async function approve(id: string) {
    setActionId(id);
    try {
      await api.patch(`/admin/reviews/${id}`, { status: 'APPROVED' });
      load(filter);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionId(null); }
  }

  async function reject(id: string) {
    setActionId(id);
    try {
      await api.patch(`/admin/reviews/${id}`, { status: 'REJECTED' });
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
        <MettloText variant="h4">Değerlendirmeler</MettloText>
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
          data={reviews}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>Değerlendirme bulunamadı</MettloText>}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <MettloAvatar uri={r.reviewer.avatarUrl} name={r.reviewer.name} size={40} />
                <View style={styles.info}>
                  <MettloText style={styles.name}>{r.reviewer.name}</MettloText>
                  {r.coach && <MettloText style={styles.sub}>→ {r.coach.name} için</MettloText>}
                  <Stars rating={r.rating} />
                </View>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[r.status]}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[r.status] }]}>{STATUS_LABEL[r.status]}</MettloText>
                </View>
              </View>
              {r.comment && <MettloText style={styles.comment} numberOfLines={4}>{r.comment}</MettloText>}
              <MettloText style={styles.date}>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</MettloText>
              {r.status === 'PENDING' && (
                <View style={styles.btnRow}>
                  <MettloButton label="✅ Onayla" onPress={() => approve(r.id)} loading={actionId === r.id} style={{ flex: 1 }} />
                  <MettloButton label="❌ Reddet" variant="danger" onPress={() => reject(r.id)} loading={actionId === r.id} style={{ flex: 1 }} />
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
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  info: { flex: 1, gap: Space.s2 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  comment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  date: { fontSize: 12, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Space.s10 },
});
