import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AdminTickets'>;

interface Ticket {
  id: string;
  subject: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  user: { name: string; username: string };
  lastMessage?: string;
}

const STATUS_LABEL: Record<string, string> = { OPEN: 'Açık', ANSWERED: 'Yanıtlandı', CLOSED: 'Kapalı' };
const STATUS_COLOR: Record<string, string> = { OPEN: '#F59E0B', ANSWERED: '#3B82F6', CLOSED: Colors.textMuted };
const PRIORITY_COLOR: Record<string, string> = { URGENT: '#EF4444', HIGH: '#F97316', NORMAL: Colors.textMuted, LOW: Colors.borderSubtle };
const FILTERS = ['Açık', 'Yanıtlandı', 'Kapalı', 'Tümü'];
const FILTER_MAP: Record<string, string> = { 'Açık': 'OPEN', 'Yanıtlandı': 'ANSWERED', 'Kapalı': 'CLOSED', 'Tümü': '' };

export function AdminTicketsScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const initFilter = params?.filter === 'OPEN' ? 'Açık' : 'Açık';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initFilter);
  const [closingId, setClosingId] = useState<string | null>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const p: any = {};
      if (FILTER_MAP[f]) p.status = FILTER_MAP[f];
      const res = await api.get<{ data: Ticket[] }>('/support', { params: p });
      setTickets(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  async function closeTicket(id: string) {
    Alert.alert('Bileti Kapat', 'Bu destek biletini kapatmak istiyor musunuz?', [
      {
        text: 'Kapat', style: 'destructive', onPress: async () => {
          setClosingId(id);
          try {
            await api.post(`/support/${id}/close`);
            load(filter);
          } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
          } finally { setClosingId(null); }
        }
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Destek Biletleri</MettloText>
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
          data={tickets}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>Bilet bulunamadı</MettloText>}
          renderItem={({ item: t }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.titleWrap}>
                  <MettloText style={styles.subject} numberOfLines={2}>{t.subject}</MettloText>
                  <MettloText style={styles.sub}>{t.user.name} · @{t.user.username}</MettloText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[t.status]}20` }]}>
                    <MettloText style={[styles.badgeText, { color: STATUS_COLOR[t.status] }]}>{STATUS_LABEL[t.status]}</MettloText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${PRIORITY_COLOR[t.priority]}20` }]}>
                    <MettloText style={[styles.badgeText, { color: PRIORITY_COLOR[t.priority] }]}>{t.priority}</MettloText>
                  </View>
                </View>
              </View>
              {t.lastMessage && <MettloText style={styles.preview} numberOfLines={2}>{t.lastMessage}</MettloText>}
              <View style={styles.footer}>
                <MettloText style={styles.date}>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</MettloText>
                {t.status !== 'CLOSED' && (
                  <MettloButton label="Kapat" variant="secondary" size="sm" onPress={() => closeTicket(t.id)} loading={closingId === t.id} />
                )}
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
  topRow: { flexDirection: 'row', gap: Space.s12 },
  titleWrap: { flex: 1 },
  subject: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  preview: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 12, color: Colors.textMuted },
});
