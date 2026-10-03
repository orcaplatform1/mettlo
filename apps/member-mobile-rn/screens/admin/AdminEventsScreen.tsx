import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_TR: Record<string, string> = { DRAFT: 'Taslak', PUBLISHED: 'Yayında', CANCELLED: 'İptal', COMPLETED: 'Tamamlandı' };
const STATUS_COLORS: Record<string, string> = { DRAFT: Colors.textMuted, PUBLISHED: Colors.success, CANCELLED: Colors.error, COMPLETED: Colors.primary };
const FILTERS = [['', 'Tümü'], ['DRAFT', 'Taslak'], ['PUBLISHED', 'Yayında'], ['CANCELLED', 'İptal'], ['COMPLETED', 'Tamamlandı']];

const fmtTL = (k: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(k / 100);
const fmtDate = (s: string) => new Date(s).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

export function AdminEventsScreen() {
  const nav = useNavigation();
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(async (p: number, s: string, replace = false) => {
    try {
      const params: any = { page: p };
      if (s) params.status = s;
      const res = await api.get<{ items: any[]; total: number }>('/admin/events', { params });
      const list = res.data.items ?? [];
      if (replace) { setTotal(res.data.total ?? 0); setEvents(list); }
      else setEvents(prev => [...prev, ...list]);
      setHasMore(list.length === 30);
      setPage(p);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { setLoading(true); setEvents([]); load(1, status, true); }, [status]);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    load(page + 1, status);
  }

  async function cancelEvent(id: string) {
    try {
      await api.patch(`/admin/events/${id}/cancel`);
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'CANCELLED' } : e));
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Etkinlikler</MettloText>
        <MettloText style={styles.total}>{total}</MettloText>
      </View>

      <View style={styles.filters}>
        {FILTERS.map(([v, l]) => (
          <TouchableOpacity key={v} style={[styles.chip, status === v && styles.chipActive]} onPress={() => setStatus(v)}>
            <MettloText style={[styles.chipText, status === v && styles.chipTextActive] as any}>{l}</MettloText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<MettloText style={styles.empty}>Etkinlik yok</MettloText>}
          renderItem={({ item: ev }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <MettloText style={{ fontWeight: '700', fontSize: 15 }}>{ev.title}</MettloText>
                  <MettloText style={styles.caption}>{ev.slug}</MettloText>
                </View>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[ev.status] ?? Colors.textMuted}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLORS[ev.status] ?? Colors.textMuted }]}>{STATUS_TR[ev.status] ?? ev.status}</MettloText>
                </View>
              </View>
              <MettloText style={styles.caption}>Organizatör: {ev.organizer?.name ?? ev.organizer?.username ?? '—'}</MettloText>
              <MettloText style={styles.caption}>Başlangıç: {fmtDate(ev.startsAt)}</MettloText>
              <MettloText style={styles.caption}>
                Kapasite: {ev.capacityLimit ?? 'Sınırsız'} · Fiyat: {ev.ticketPriceKurus > 0 ? fmtTL(ev.ticketPriceKurus) : 'Ücretsiz'}
              </MettloText>
              <MettloText style={styles.caption}>{ev._count?.tickets ?? 0} bilet · {ev._count?.registrations ?? 0} kayıt</MettloText>
              {ev.status === 'PUBLISHED' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelEvent(ev.id)}>
                  <MettloText style={{ fontSize: 13, color: Colors.error }}>İptal Et</MettloText>
                </TouchableOpacity>
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Space.s16, gap: Space.s8, paddingVertical: Space.s10 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { margin: Space.s12, marginBottom: 0, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12, marginBottom: Space.s8 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cancelBtn: { marginTop: Space.s10, paddingVertical: Space.s8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error, alignItems: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
