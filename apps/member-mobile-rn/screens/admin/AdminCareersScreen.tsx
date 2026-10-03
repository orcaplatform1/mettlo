import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  NEW: Colors.primary, REVIEWING: '#8B5CF6', INTERVIEW: '#3B82F6', REJECTED: Colors.error, HIRED: Colors.success,
};
const STATUS_TR: Record<string, string> = {
  NEW: 'Yeni', REVIEWING: 'İnceleniyor', INTERVIEW: 'Görüşme', REJECTED: 'Reddedildi', HIRED: 'İşe alındı',
};
const POSITION_TR: Record<string, string> = {
  moderator: 'Moderatör', 'pr-specialist': 'Halkla İlişkiler',
};

const FILTERS = [['', 'Tümü'], ['NEW', 'Yeni'], ['REVIEWING', 'İnceleniyor'], ['INTERVIEW', 'Görüşme'], ['REJECTED', 'Reddedildi'], ['HIRED', 'İşe alındı']];

export function AdminCareersScreen() {
  const nav = useNavigation();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (s) params.status = s;
      const res = await api.get('/admin/applications', { params });
      setApps(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(status); }, [status]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Kariyer Başvuruları</MettloText>
        <View style={{ width: 48 }} />
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
          data={apps}
          keyExtractor={a => a.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<MettloText style={styles.empty}>Başvuru yok</MettloText>}
          renderItem={({ item: a }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>{a.fullName}</MettloText>
                <MettloText style={styles.caption}>{a.email}</MettloText>
                <MettloText style={styles.caption}>{POSITION_TR[a.positionKey] ?? a.positionKey} · {a.city} · {a.experienceYears} yıl deneyim</MettloText>
                <MettloText style={styles.caption}>{new Date(a.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</MettloText>
              </View>
              <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[a.status] ?? Colors.textMuted}20` }]}>
                <MettloText style={[styles.badgeText, { color: STATUS_COLORS[a.status] ?? Colors.textMuted }]}>{STATUS_TR[a.status] ?? a.status}</MettloText>
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Space.s16, gap: Space.s8, paddingVertical: Space.s10 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
