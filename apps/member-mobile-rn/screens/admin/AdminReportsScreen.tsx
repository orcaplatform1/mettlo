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

interface Report {
  id: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  targetType: string;
  targetId: string;
  createdAt: string;
  reporter: { name: string; username: string };
  target?: { name?: string; username?: string; content?: string };
}

const STATUS_LABEL: Record<string, string> = { OPEN: 'Açık', RESOLVED: 'Çözüldü', DISMISSED: 'Reddedildi' };
const STATUS_COLOR: Record<string, string> = { OPEN: '#EF4444', RESOLVED: '#10B981', DISMISSED: Colors.textMuted };
const FILTERS = ['Açık', 'Çözüldü', 'Reddedildi', 'Tümü'];
const FILTER_MAP: Record<string, string> = { 'Açık': 'OPEN', 'Çözüldü': 'RESOLVED', 'Reddedildi': 'DISMISSED', 'Tümü': '' };

export function AdminReportsScreen() {
  const nav = useNavigation<Nav>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Açık');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const p: any = {};
      if (FILTER_MAP[f]) p.status = FILTER_MAP[f];
      const res = await api.get<{ data: Report[] }>('/admin/reports', { params: p });
      setReports(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  async function resolve(id: string) {
    setActionId(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status: 'RESOLVED' });
      load(filter);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionId(null); }
  }

  async function dismiss(id: string) {
    setActionId(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status: 'DISMISSED' });
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
        <MettloText variant="h4">Şikâyetler</MettloText>
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
          data={reports}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>Şikâyet bulunamadı</MettloText>}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.infoWrap}>
                  <MettloText style={styles.reason}>{r.reason}</MettloText>
                  <MettloText style={styles.sub}>
                    {r.reporter.name} · {r.targetType} şikâyeti
                  </MettloText>
                  {r.target?.username && <MettloText style={styles.sub}>Hedef: @{r.target.username}</MettloText>}
                </View>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[r.status]}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[r.status] }]}>{STATUS_LABEL[r.status]}</MettloText>
                </View>
              </View>
              {r.target?.content && <MettloText style={styles.content} numberOfLines={3}>{r.target.content}</MettloText>}
              <MettloText style={styles.date}>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</MettloText>
              {r.status === 'OPEN' && (
                <View style={styles.btnRow}>
                  <MettloButton label="✅ Çözüldü" onPress={() => resolve(r.id)} loading={actionId === r.id} style={{ flex: 1 }} />
                  <MettloButton label="🚫 Reddet" variant="secondary" onPress={() => dismiss(r.id)} loading={actionId === r.id} style={{ flex: 1 }} />
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
  topRow: { flexDirection: 'row', gap: Space.s12 },
  infoWrap: { flex: 1, gap: Space.s4 },
  reason: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  content: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, fontStyle: 'italic' },
  date: { fontSize: 12, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Space.s10 },
});
