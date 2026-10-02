import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

async function fetchBookings() {
  const res = await api.get('/me/bookings');
  return res.data as any[];
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Onaylandı',
  PENDING: 'Bekliyor',
  WAITLISTED: 'Bekleme Listesi',
  CANCELLED: 'İptal',
};
const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: Colors.success,
  PENDING: Colors.warning,
  WAITLISTED: Colors.textMuted,
  CANCELLED: Colors.error,
};

export function ReservationsScreen() {
  const nav = useNavigation();
  const { data, isLoading } = useQuery({ queryKey: ['me-bookings'], queryFn: fetchBookings });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </Pressable>
        <MettloText variant="h2">Rezervasyonlarım</MettloText>
        <MettloText variant="bodySm" color={Colors.textMuted}>
          Derse 24 saatten az kala iptal edilemez.
        </MettloText>
      </View>

      {isLoading ? <MettloLoadingState /> : !data?.length ? (
        <MettloEmptyState icon="📅" title="Rezervasyonun yok" description="Abone olduğun koçların derslerinden rezervasyon yapabilirsin." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {data.map((b: any) => {
            const date = b.session?.startsAt ? new Date(b.session.startsAt) : null;
            const dateStr = date ? date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '';
            const statusColor = STATUS_COLOR[b.status] ?? Colors.textMuted;
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <MettloText variant="h5" numberOfLines={2}>{b.session?.title ?? 'Ders'}</MettloText>
                    {b.session?.creator && (
                      <MettloText variant="caption" color={Colors.textMuted}>@{b.session.creator.username}</MettloText>
                    )}
                    {dateStr ? <MettloText variant="caption" color={Colors.textSecondary}>{dateStr}</MettloText> : null}
                  </View>
                  <View style={[styles.badge, { borderColor: statusColor }]}>
                    <MettloText style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </MettloText>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s12, gap: Space.s8 },
  list: { padding: Space.s16, gap: Space.s12 },
  card: {
    backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  badge: {
    borderWidth: 1, borderRadius: Radius.pill,
    paddingHorizontal: Space.s10, paddingVertical: Space.s4,
    alignSelf: 'flex-start',
  },
});
