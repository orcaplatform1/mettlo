import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_TR: Record<string, string> = { DRAFT: 'Taslak', SUBMITTED: 'İncelemede', APPROVED: 'Onaylandı', ACTIVE: 'Yayında', PAUSED: 'Duraklatıldı', COMPLETED: 'Tamamlandı', REJECTED: 'Reddedildi', PAYMENT_PENDING: 'Ödeme Bekliyor' };
const STATUS_COLORS: Record<string, string> = { DRAFT: Colors.textMuted, SUBMITTED: Colors.warning, APPROVED: Colors.success, ACTIVE: Colors.success, PAUSED: Colors.textMuted, COMPLETED: Colors.textMuted, REJECTED: Colors.error, PAYMENT_PENDING: Colors.warning };
const PLACEMENT_TR: Record<string, string> = { FEED: 'Akış', STORY: 'Hikaye', SEARCH: 'Arama', MAP: 'Harita', BRANCH: 'Kategori' };

const fmtTRY = (k: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(k / 100);
const fmtDate = (s: string) => new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

export function AdvertisingScreen() {
  const nav = useNavigation();
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['my-ads'],
    queryFn: async () => {
      const res = await api.get('/advertising/my-ads');
      return res.data as any[];
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Reklamlarım</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : ads.length === 0 ? (
        <MettloEmptyState title="Henüz reklam yok" description="Platformdaki binlerce kullanıcıya ulaşmak için reklam oluştur" />
      ) : (
        <FlatList
          data={ads}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: Space.s12, paddingBottom: 32, gap: Space.s10 }}
          renderItem={({ item: ad }) => {
            const creative = ad.creatives?.[0];
            const placements: string[] = ad.placement ?? [];
            const ctr = ad.totalImpressions > 0 ? ((ad.totalClicks / ad.totalImpressions) * 100).toFixed(2) : '0.00';
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  {creative?.imageUrl && (
                    <Image source={{ uri: creative.imageUrl }} style={styles.thumb} resizeMode="cover" />
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <MettloText style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>{ad.title || creative?.headline || 'İsimsiz Reklam'}</MettloText>
                      <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[ad.status] ?? Colors.textMuted}20` }]}>
                        <MettloText style={[styles.badgeText, { color: STATUS_COLORS[ad.status] ?? Colors.textMuted }]}>{STATUS_TR[ad.status] ?? ad.status}</MettloText>
                      </View>
                    </View>
                    {ad.rejectionReason && (
                      <MettloText style={{ fontSize: 12, color: Colors.error, marginTop: 4 }}>Red: {ad.rejectionReason}</MettloText>
                    )}
                    <MettloText style={styles.caption}>Konum: {placements.map(p => PLACEMENT_TR[p] ?? p).join(', ')}</MettloText>
                    <MettloText style={styles.caption}>Bütçe: {fmtTRY(ad.budget)}{ad.startAt ? ` · ${fmtDate(ad.startAt)}` : ''}{ad.endAt ? ` – ${fmtDate(ad.endAt)}` : ''}</MettloText>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <MettloText style={styles.statVal}>{ad.totalImpressions ?? 0}</MettloText>
                    <MettloText style={styles.statLab}>Gösterim</MettloText>
                  </View>
                  <View style={styles.stat}>
                    <MettloText style={styles.statVal}>{ad.totalClicks ?? 0}</MettloText>
                    <MettloText style={styles.statLab}>Tıklama</MettloText>
                  </View>
                  <View style={styles.stat}>
                    <MettloText style={styles.statVal}>%{ctr}</MettloText>
                    <MettloText style={styles.statLab}>CTR</MettloText>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  card: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle },
  cardRow: { flexDirection: 'row', gap: Space.s12, marginBottom: Space.s12 },
  thumb: { width: 80, height: 80, borderRadius: Radius.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s8, marginBottom: 4 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: Space.s10, gap: Space.s20 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700' },
  statLab: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
