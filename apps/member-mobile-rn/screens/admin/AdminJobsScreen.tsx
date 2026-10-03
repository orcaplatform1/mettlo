import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function AdminJobsScreen() {
  const nav = useNavigation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/jobs');
      setJobs(res.data?.items ?? res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function closeJob(id: string) {
    try {
      await api.patch(`/admin/jobs/${id}/close`);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, isOpen: false } : j));
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">İş İlanları</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => j.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<MettloText style={styles.empty}>İş ilanı yok</MettloText>}
          renderItem={({ item: j }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <MettloText style={{ fontWeight: '700' }}>{j.title}</MettloText>
                  <MettloText style={styles.caption}>{j.business?.name ?? j.businessName ?? '—'}</MettloText>
                  <MettloText style={styles.caption}>{j.location ?? ''} · {j._count?.applications ?? 0} başvuru</MettloText>
                  <MettloText style={styles.caption}>{new Date(j.createdAt).toLocaleDateString('tr-TR')}</MettloText>
                </View>
                <View style={[styles.badge, { backgroundColor: j.isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.15)' }]}>
                  <MettloText style={[styles.badgeText, { color: j.isOpen ? Colors.success : Colors.textMuted }]}>{j.isOpen ? 'Açık' : 'Kapalı'}</MettloText>
                </View>
              </View>
              {j.isOpen && (
                <TouchableOpacity style={styles.closeBtn} onPress={() => closeJob(j.id)}>
                  <MettloText style={{ fontSize: 13, color: Colors.error }}>İlanı Kapat</MettloText>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: Space.s12, marginTop: Space.s12, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  closeBtn: { marginTop: Space.s10, paddingVertical: Space.s8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error, alignItems: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
