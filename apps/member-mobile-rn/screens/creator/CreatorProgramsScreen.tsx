import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Program {
  id: string;
  slug: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  level?: string;
  durationWeeks?: number;
  enrolledCount?: number;
  price?: number;
  currency?: string;
  branch?: string;
}

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Taslak', PUBLISHED: 'Yayında', ARCHIVED: 'Arşivlendi' };
const STATUS_COLOR: Record<string, string> = { DRAFT: '#F59E0B', PUBLISHED: '#10B981', ARCHIVED: Colors.textMuted };

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

export function CreatorProgramsScreen() {
  const nav = useNavigation<Nav>();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get<{ data: Program[] }>('/me/programs');
      setPrograms(res.data.data ?? (res.data as any));
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
        <MettloText variant="h4">Programlarım</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
          ListEmptyComponent={<MettloText style={styles.empty}>Henüz programın yok</MettloText>}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => nav.navigate('ProgramDetail', { slug: p.slug })}
            >
              <View style={styles.topRow}>
                <View style={styles.info}>
                  <MettloText style={styles.title}>{p.title}</MettloText>
                  <View style={styles.tagRow}>
                    {p.branch && <View style={styles.tag}><MettloText style={styles.tagText}>{p.branch}</MettloText></View>}
                    {p.level && <View style={styles.tag}><MettloText style={styles.tagText}>{p.level}</MettloText></View>}
                    {p.durationWeeks && <View style={styles.tag}><MettloText style={styles.tagText}>{p.durationWeeks} hafta</MettloText></View>}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[p.status]}20` }]}>
                    <MettloText style={[styles.statusText, { color: STATUS_COLOR[p.status] }]}>{STATUS_LABEL[p.status]}</MettloText>
                  </View>
                  {p.price != null && <MettloText style={styles.price}>{p.price === 0 ? 'Ücretsiz' : fmt(p.price)}</MettloText>}
                </View>
              </View>
              {p.enrolledCount != null && (
                <MettloText style={styles.enrolled}>👥 {p.enrolledCount} kayıtlı üye</MettloText>
              )}
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
  list: { padding: Space.s16, gap: Space.s12 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12 },
  info: { flex: 1, gap: Space.s6 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s6 },
  tag: { backgroundColor: Colors.surface3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  tagText: { fontSize: 11, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  enrolled: { fontSize: 13, color: Colors.textMuted },
});
