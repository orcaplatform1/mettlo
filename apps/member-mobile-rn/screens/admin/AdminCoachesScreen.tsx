import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AdminCoaches'>;

interface Coach {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: { id: string; name: string; username: string; avatarUrl?: string; email?: string };
  headline?: string;
  bio?: string;
  branches?: string[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: { name: string };
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Bekliyor', APPROVED: 'Onaylı', REJECTED: 'Reddedildi' };
const STATUS_COLOR: Record<string, string> = { PENDING: '#F59E0B', APPROVED: '#10B981', REJECTED: '#EF4444' };
const FILTERS = ['Bekleyen', 'Onaylı', 'Reddedildi', 'Tümü'];
const FILTER_MAP: Record<string, string> = { 'Bekleyen': 'PENDING', 'Onaylı': 'APPROVED', 'Reddedildi': 'REJECTED', 'Tümü': '' };

export function AdminCoachesScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const initFilter = params?.filter === 'APPROVED' ? 'Onaylı' : params?.filter === 'PENDING' ? 'Bekleyen' : 'Bekleyen';

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initFilter);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (FILTER_MAP[f]) params.status = FILTER_MAP[f];
      const res = await api.get<{ data: Coach[] }>('/admin/creators', { params });
      setCoaches(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  async function approve(coach: Coach) {
    setActionId(coach.id);
    try {
      await api.patch(`/admin/creators/${coach.userId}/status`, { status: 'APPROVED' });
      Alert.alert('Onaylandı', `${coach.user.name} koç olarak onaylandı.`);
      load(filter);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionId(null); }
  }

  async function reject(coach: Coach) {
    Alert.prompt('Red Nedeni', 'Red gerekçesini girin:', async (reason) => {
      if (!reason?.trim()) return;
      setActionId(coach.id);
      try {
        await api.patch(`/admin/creators/${coach.userId}/status`, { status: 'REJECTED', reason: reason.trim() });
        Alert.alert('Reddedildi', `${coach.user.name} başvurusu reddedildi.`);
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
        <MettloText variant="h4">Koçlar</MettloText>
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
          data={coaches}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>Koç bulunamadı</MettloText>}
          renderItem={({ item: c }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <MettloAvatar uri={c.user.avatarUrl} name={c.user.name} size={48} />
                <View style={styles.info}>
                  <MettloText variant="body" style={{ fontWeight: '600' }}>{c.user.name}</MettloText>
                  <MettloText style={styles.sub}>@{c.user.username}</MettloText>
                  {c.headline && <MettloText style={styles.headline}>{c.headline}</MettloText>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[c.status]}20` }]}>
                  <MettloText style={[styles.statusText, { color: STATUS_COLOR[c.status] }]}>{STATUS_LABEL[c.status]}</MettloText>
                </View>
              </View>

              {c.bio && <MettloText style={styles.bio} numberOfLines={3}>{c.bio}</MettloText>}
              {c.branches && c.branches.length > 0 && (
                <View style={styles.branchRow}>
                  {c.branches.map(b => (
                    <View key={b} style={styles.branchTag}><MettloText style={styles.branchText}>{b}</MettloText></View>
                  ))}
                </View>
              )}
              {c.submittedAt && <MettloText style={styles.date}>Başvuru: {new Date(c.submittedAt).toLocaleDateString('tr-TR')}</MettloText>}
              {c.reviewedBy && <MettloText style={styles.date}>İnceleyen: {c.reviewedBy.name}</MettloText>}

              {c.status === 'PENDING' && (
                <View style={styles.btnRow}>
                  <MettloButton
                    label="✅ Onayla"
                    onPress={() => approve(c)}
                    loading={actionId === c.id}
                    style={{ flex: 1 }}
                  />
                  <MettloButton
                    label="❌ Reddet"
                    variant="danger"
                    onPress={() => reject(c)}
                    loading={actionId === c.id}
                    style={{ flex: 1 }}
                  />
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
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  info: { flex: 1, gap: Space.s2 },
  sub: { fontSize: 12, color: Colors.textMuted },
  headline: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  bio: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  branchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s6 },
  branchTag: { backgroundColor: Colors.surface3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  branchText: { fontSize: 11, color: Colors.textMuted },
  date: { fontSize: 12, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Space.s10 },
});
