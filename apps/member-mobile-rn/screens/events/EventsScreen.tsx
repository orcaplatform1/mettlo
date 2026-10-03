import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

export function EventsScreen() {
  const nav = useNavigation<Nav>();
  const now = new Date();

  const { data, isLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const r = await api.get<{ tickets: any[]; registrations: any[] }>('/me/event-tickets');
      return r.data;
    },
  });

  const tickets = data?.tickets ?? [];
  const registrations = data?.registrations ?? [];

  const allItems = [
    ...tickets.map((t) => ({ item: t, paid: true })),
    ...registrations.map((r) => ({ item: r, paid: false })),
  ].sort((a, b) =>
    new Date((a.item.event ?? a.item).startsAt).getTime() -
    new Date((b.item.event ?? b.item).startsAt).getTime()
  );

  const upcoming = allItems.filter(({ item }) => new Date((item.event ?? item).startsAt) >= now);
  const past = allItems.filter(({ item }) => new Date((item.event ?? item).startsAt) < now);

  function renderCard({ item, paid }: { item: any; paid: boolean }) {
    const ev = item.event ?? item;
    const organizer = ev.organizer;
    const isPast = new Date(ev.startsAt) < now;
    const location = ev.isOnline ? 'Online' : [ev.locationName, ev.city?.name].filter(Boolean).join(', ') || '—';

    return (
      <View key={item.id} style={[styles.card, isPast && { opacity: 0.65 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Space.s12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s8, flexWrap: 'wrap', marginBottom: Space.s6 }}>
              <MettloText style={{ fontWeight: '700', fontSize: 15 }}>{ev.title}</MettloText>
              <View style={[styles.typeBadge, { backgroundColor: paid ? 'rgba(249,115,22,0.12)' : 'rgba(34,197,94,0.12)' }]}>
                <MettloText style={[styles.typeBadgeText, { color: paid ? Colors.primary : Colors.success }]}>
                  {paid ? 'Biletli' : 'Ücretsiz'}
                </MettloText>
              </View>
              {isPast && (
                <View style={styles.pastBadge}>
                  <MettloText style={styles.pastBadgeText}>Tamamlandı</MettloText>
                </View>
              )}
            </View>
            <MettloText style={styles.detail}>🕐 {dtFmt(ev.startsAt)}{ev.endsAt ? ` — ${dtFmt(ev.endsAt)}` : ''}</MettloText>
            <MettloText style={styles.detail}>📍 {location}</MettloText>
            {organizer && (
              <MettloText style={styles.detail}>
                📅 {organizer.name ?? organizer.username}
              </MettloText>
            )}
            {paid && item.qrToken && (
              <MettloText style={[styles.detail, { fontFamily: 'monospace', marginTop: Space.s6 }]}>
                #{item.qrToken.slice(0, 8).toUpperCase()}
              </MettloText>
            )}
          </View>
          {organizer && (
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() => nav.navigate('Messages')}
            >
              <MettloText style={styles.msgBtnText}>💬 Organizatöre Yaz</MettloText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">🎟️ Etkinliklerim</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 40 }}>
          {allItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <MettloText style={styles.emptyIcon}>🎟️</MettloText>
              <MettloText style={styles.emptyText}>Henüz katıldığın bir etkinlik yok.</MettloText>
            </View>
          ) : (
            <>
              {upcoming.length > 0 && (
                <View style={{ marginBottom: Space.s20 }}>
                  <MettloText style={styles.sectionLabel}>YAKLAŞAN ({upcoming.length})</MettloText>
                  <View style={{ gap: Space.s12 }}>
                    {upcoming.map(({ item, paid }) => renderCard({ item, paid }))}
                  </View>
                </View>
              )}
              {past.length > 0 && (
                <View>
                  <MettloText style={styles.sectionLabel}>GEÇMİŞ ({past.length})</MettloText>
                  <View style={{ gap: Space.s12 }}>
                    {past.map(({ item, paid }) => renderCard({ item, paid }))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  card: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Space.s12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  pastBadge: { backgroundColor: Colors.surface1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  pastBadgeText: { fontSize: 11, color: Colors.textMuted },
  detail: { fontSize: 13, color: Colors.textSecondary, marginTop: Space.s4, lineHeight: 18 },
  msgBtn: { backgroundColor: Colors.surface1, borderRadius: Radius.pill, paddingHorizontal: Space.s10, paddingVertical: Space.s6, borderWidth: 1, borderColor: Colors.borderSubtle, alignSelf: 'flex-start' },
  msgBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  emptyCard: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: 40, borderWidth: 1, borderColor: Colors.borderSubtle, alignItems: 'center', gap: Space.s12 },
  emptyIcon: { fontSize: 36, opacity: 0.3 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
