import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NotificationsScreen() {
  const nav = useNavigation<Nav>();
  const qc = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const r = await api.get('/me/notifications'); return r.data as any[]; },
  });

  const unread = list.filter((n) => !n.readAt).length;

  async function markAllRead() {
    try {
      await api.post('/me/notifications/read');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      Alert.alert('Hata', 'İşlem başarısız');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Bildirimler</MettloText>
        {unread > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <MettloText style={styles.markAllBtn}>Tümünü oku</MettloText>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading ? <MettloLoadingState /> : list.length === 0 ? (
        <MettloEmptyState title="Bildirimin yok" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Space.s12, paddingBottom: 40, gap: Space.s8 }}>
          {list.map((n) => {
            const hasLink = !!n.data?.ticketId;
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.card, !n.readAt && styles.cardUnread]}
                activeOpacity={hasLink ? 0.7 : 1}
                onPress={() => {
                  if (n.data?.ticketId) nav.navigate('SupportDetail', { ticketId: n.data.ticketId });
                }}
              >
                <View style={styles.row}>
                  <MettloText style={styles.title}>{n.title}</MettloText>
                  {!n.readAt && (
                    <View style={styles.newBadge}>
                      <MettloText style={styles.newBadgeText}>Yeni</MettloText>
                    </View>
                  )}
                </View>
                {n.body && <MettloText style={styles.body}>{n.body}</MettloText>}
                <MettloText style={styles.time}>
                  {new Date(n.createdAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                </MettloText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  markAllBtn: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  card: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle, gap: Space.s4 },
  cardUnread: { borderColor: `${Colors.primary}40`, backgroundColor: `${Colors.primary}08` },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Space.s8 },
  title: { fontWeight: '700', fontSize: 14, flex: 1 },
  body: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: Space.s2 },
  newBadge: { backgroundColor: `${Colors.primary}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  newBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
});
