import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

interface Branch {
  slug: string;
  name: string;
  isActive: boolean;
  requiresLegalReview: boolean;
}

export function AdminBranchesScreen() {
  const nav = useNavigation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Branch[]>('/admin/branches');
      setBranches(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function toggle(slug: string, current: boolean) {
    setToggling(slug);
    try {
      await api.patch(`/admin/branches/${slug}`, { isActive: !current });
      setBranches(prev => prev.map(b => b.slug === slug ? { ...b, isActive: !current } : b));
    } catch {}
    finally { setToggling(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Branşlar</MettloText>
        <View style={{ width: 48 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={b => b.slug}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: b }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>{b.name}</MettloText>
                <MettloText style={styles.caption}>/category/{b.slug}</MettloText>
                {b.requiresLegalReview && (
                  <View style={styles.legalBadge}>
                    <MettloText style={{ fontSize: 11, color: Colors.error }}>Hukuki inceleme gerekir</MettloText>
                  </View>
                )}
              </View>
              <View style={styles.switchRow}>
                <MettloText style={{ fontSize: 12, color: b.isActive ? Colors.success : Colors.textMuted }}>
                  {b.isActive ? 'Açık' : 'Kapalı'}
                </MettloText>
                <Switch
                  value={b.isActive}
                  onValueChange={() => toggle(b.slug, b.isActive)}
                  disabled={toggling === b.slug}
                  trackColor={{ false: Colors.borderSubtle, true: Colors.primary }}
                  thumbColor="#fff"
                />
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
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  legalBadge: { marginTop: 4, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, alignSelf: 'flex-start' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s8 },
});
