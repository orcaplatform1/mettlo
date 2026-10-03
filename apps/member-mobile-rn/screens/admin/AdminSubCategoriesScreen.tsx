import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function AdminSubCategoriesScreen() {
  const nav = useNavigation();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/sub-categories');
      setBranches(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function toggleSubCat(id: string, isActive: boolean) {
    try {
      await api.patch(`/admin/sub-categories/${id}`, { isActive: !isActive });
      setBranches(prev => prev.map(b => ({
        ...b,
        subCategories: b.subCategories.map((s: any) => s.id === id ? { ...s, isActive: !isActive } : s),
      })));
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Alt Kategoriler</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: Space.s16, paddingTop: Space.s16 }}>
          {branches.filter(b => b.subCategories?.length > 0).map((b) => (
            <View key={b.slug} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MettloText style={{ fontWeight: '700', fontSize: 16 }}>{b.name}</MettloText>
                {!b.isActive && (
                  <View style={styles.comingSoon}>
                    <MettloText style={{ fontSize: 11, color: Colors.textMuted }}>Yakında</MettloText>
                  </View>
                )}
              </View>
              {b.subCategories.map((s: any) => (
                <View key={s.id} style={styles.subRow}>
                  <View style={{ flex: 1 }}>
                    <MettloText>{s.name}</MettloText>
                    <MettloText style={styles.caption}>/{s.slug} · {s.coachCount} koç</MettloText>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleBtn, s.isActive ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                    onPress={() => toggleSubCat(s.id, s.isActive)}
                  >
                    <MettloText style={{ fontSize: 12, fontWeight: '600', color: s.isActive ? Colors.error : Colors.success }}>
                      {s.isActive ? 'Pasif yap' : 'Aktif yap'}
                    </MettloText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
          {branches.every(b => !b.subCategories?.length) && (
            <MettloText style={styles.empty}>Alt kategori yok</MettloText>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { backgroundColor: Colors.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Space.s16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.s8, padding: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  comingSoon: { backgroundColor: Colors.surface2, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.borderSubtle },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s14, paddingVertical: Space.s10, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  toggleBtn: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, borderWidth: 1 },
  toggleBtnActive: { borderColor: Colors.error },
  toggleBtnInactive: { borderColor: Colors.success },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
