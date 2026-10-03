import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TR: Record<string, string> = { OPEN: 'Açık', ANSWERED: 'Yanıtlandı', CLOSED: 'Kapatıldı', TIMED_OUT: 'Zaman Aşımı' };
const STATUS_COLORS: Record<string, string> = { OPEN: Colors.primary, ANSWERED: Colors.success, CLOSED: Colors.textMuted, TIMED_OUT: Colors.error };
const CAT_TR: Record<string, string> = { account: 'Hesap', payment: 'Ödeme', subscription: 'Abonelik', technical: 'Teknik', content: 'İçerik', live: 'Canlı', coaching: 'Koçluk', other: 'Diğer' };

export function SupportScreen() {
  const nav = useNavigation<Nav>();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const res = await api.get('/support/tickets');
      return res.data as any[];
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Destek Merkezi</MettloText>
        <TouchableOpacity onPress={() => nav.navigate('SupportNew')}>
          <MettloText style={{ color: Colors.primary, fontWeight: '600' }}>+ Yeni</MettloText>
        </TouchableOpacity>
      </View>

      <MettloText style={styles.info}>Sorunun için destek talebi oluştur. Yanıtlanan talebi 48 saat içinde yanıtlamazsan otomatik kapanır.</MettloText>

      {isLoading ? (
        <MettloLoadingState />
      ) : tickets.length === 0 ? (
        <MettloEmptyState title="Henüz destek talebin yok" description="Sorunun için yeni bir talep oluştur" />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={t => t.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: t }) => (
            <TouchableOpacity style={styles.row} onPress={() => nav.navigate('SupportDetail', { ticketId: t.id })}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <MettloText style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>#{t.number} {t.subject}</MettloText>
                </View>
                <MettloText style={styles.caption}>{CAT_TR[t.category] ?? t.category} · {new Date(t.lastMessageAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</MettloText>
              </View>
              <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[t.status] ?? Colors.textMuted}20` }]}>
                <MettloText style={[styles.badgeText, { color: STATUS_COLORS[t.status] ?? Colors.textMuted }]}>{STATUS_TR[t.status] ?? t.status}</MettloText>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  info: { fontSize: 13, color: Colors.textMuted, paddingHorizontal: Space.s16, paddingVertical: Space.s10, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s8 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
