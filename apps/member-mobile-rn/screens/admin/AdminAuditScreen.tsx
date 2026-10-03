import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface AuditLog {
  id: string;
  action: string;
  actorRole: string;
  actorUsername?: string;
  subjectUsername?: string;
  turkishDescription?: string;
  targetType?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export function AdminAuditScreen() {
  const nav = useNavigation<Nav>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p: number, replace = false, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get<{ items: AuditLog[]; total: number }>('/admin/audit-logs', { params: { page: p, dateFilter: 'all' } });
      const list = res.data.items ?? [];
      setLogs(prev => replace ? list : [...prev, ...list]);
      setHasMore(list.length === 200);
      setPage(p);
    } catch {}
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { load(1, true); }, [load]);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    load(page + 1);
  }

  const ROLE_COLOR: Record<string, string> = {
    SUPER_ADMIN: '#EF4444', ADMIN: '#10B981', MODERATOR: '#F59E0B',
    SUPPORT: '#C084FC', CREATOR: '#10B981', SYSTEM: Colors.textMuted,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Denetim Logları</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={l => l.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, true, true)} tintColor={Colors.primary} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<MettloText style={styles.empty}>Log bulunamadı</MettloText>}
          renderItem={({ item: l }) => (
            <View style={styles.logRow}>
              <View style={[styles.roleDot, { backgroundColor: ROLE_COLOR[l.actorRole] ?? Colors.borderSubtle }]} />
              <View style={styles.logInfo}>
                <MettloText style={styles.action}>{l.turkishDescription ?? l.action}</MettloText>
                <View style={styles.metaRow}>
                  {l.actorUsername && <MettloText style={styles.actor}>@{l.actorUsername}</MettloText>}
                  {l.targetType && <MettloText style={styles.meta}>· {l.targetType}</MettloText>}
                  <MettloText style={styles.meta}>· {new Date(l.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</MettloText>
                </View>
                {l.ip && <MettloText style={styles.ip}>{l.ip}</MettloText>}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 32 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s10, paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  roleDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  logInfo: { flex: 1, gap: Space.s2 },
  action: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'monospace' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s4, flexWrap: 'wrap' },
  actor: { fontSize: 12, color: Colors.primary },
  meta: { fontSize: 12, color: Colors.textMuted },
  ip: { fontSize: 11, color: Colors.borderSubtle, fontFamily: 'monospace' },
});
