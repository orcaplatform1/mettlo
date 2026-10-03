import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Client {
  id: string;
  member: { id: string; name: string; username: string; avatarUrl?: string };
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  startDate?: string;
  plan?: string;
  sessionsCompleted?: number;
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Aktif', INACTIVE: 'Pasif', PENDING: 'Bekliyor' };
const STATUS_COLOR: Record<string, string> = { ACTIVE: '#10B981', INACTIVE: Colors.textMuted, PENDING: '#F59E0B' };

export function CreatorClientsScreen() {
  const nav = useNavigation<Nav>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get<{ data: Client[] }>('/coaching/clients');
      setClients(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Danışanlarım</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
          ListEmptyComponent={<MettloText style={styles.empty}>Henüz danışanın yok</MettloText>}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => nav.navigate('Messages')}
            >
              <MettloAvatar uri={c.member.avatarUrl} name={c.member.name} size={48} />
              <View style={styles.info}>
                <MettloText style={styles.name}>{c.member.name}</MettloText>
                <MettloText style={styles.sub}>@{c.member.username}</MettloText>
                {c.plan && <MettloText style={styles.plan}>{c.plan}</MettloText>}
                {c.sessionsCompleted != null && (
                  <MettloText style={styles.sessions}>{c.sessionsCompleted} seans tamamlandı</MettloText>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[c.status]}20` }]}>
                  <MettloText style={[styles.badgeText, { color: STATUS_COLOR[c.status] }]}>{STATUS_LABEL[c.status]}</MettloText>
                </View>
                {c.startDate && <MettloText style={styles.date}>{new Date(c.startDate).toLocaleDateString('tr-TR')}</MettloText>}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 32 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Space.s12, paddingHorizontal: Space.s16, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  info: { flex: 1, gap: Space.s2 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted },
  plan: { fontSize: 12, color: Colors.primary },
  sessions: { fontSize: 12, color: Colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 11, color: Colors.textMuted },
});
