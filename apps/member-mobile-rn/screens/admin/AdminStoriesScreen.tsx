import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function AdminStoriesScreen() {
  const nav = useNavigation();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stories', { params: query ? { q: query } : {} });
      setStories(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(''); }, []);

  function onSearch(v: string) {
    setQ(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(v), 400);
  }

  function deleteStory(id: string) {
    Alert.alert('Hikayeyi Sil', 'Bu hikayeyi kalıcı olarak silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/stories/${id}`);
          setStories(prev => prev.filter(s => s.id !== id));
        } catch {}
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Hikaye Moderasyonu</MettloText>
        <MettloText style={{ color: Colors.textMuted }}>{stories.length}</MettloText>
      </View>

      <View style={styles.searchWrap}>
        <TextInput style={styles.search} placeholder="Kullanıcı adı ara…" placeholderTextColor={Colors.textMuted} value={q} onChangeText={onSearch} autoCapitalize="none" />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={s => s.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: Space.s12, gap: Space.s10 }}
          contentContainerStyle={{ paddingVertical: Space.s10, paddingBottom: 32 }}
          ListEmptyComponent={<MettloText style={styles.empty}>Hikaye bulunamadı</MettloText>}
          renderItem={({ item: s }) => {
            const expired = new Date(s.expiresAt) < new Date();
            return (
              <View style={styles.card}>
                <View style={styles.mediaWrap}>
                  {s.mediaUrl ? (
                    <Image source={{ uri: s.mediaUrl }} style={styles.media} resizeMode="cover" />
                  ) : (
                    <View style={[styles.media, { backgroundColor: Colors.surface2 }]} />
                  )}
                  {expired && (
                    <View style={styles.expiredBadge}>
                      <MettloText style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>Süresi Doldu</MettloText>
                    </View>
                  )}
                </View>
                <View style={styles.userRow}>
                  <MettloAvatar uri={s.user?.avatarUrl} name={s.user?.name} size={24} />
                  <View style={{ flex: 1 }}>
                    <MettloText style={{ fontSize: 12, fontWeight: '600' }}>{s.user?.name}</MettloText>
                    <MettloText style={{ fontSize: 11, color: Colors.textMuted }}>@{s.user?.username}</MettloText>
                  </View>
                </View>
                {s.caption ? (
                  <MettloText style={styles.caption} numberOfLines={2}>{s.caption}</MettloText>
                ) : null}
                <View style={styles.footer}>
                  <MettloText style={styles.caption}>👁 {s.viewCount}</MettloText>
                  <TouchableOpacity onPress={() => deleteStory(s.id)}>
                    <MettloText style={{ fontSize: 12, color: Colors.error }}>Sil</MettloText>
                  </TouchableOpacity>
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
  searchWrap: { paddingHorizontal: Space.s16, paddingVertical: Space.s10 },
  search: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 44, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Space.s10 },
  mediaWrap: { position: 'relative', height: 120 },
  media: { width: '100%', height: '100%' },
  expiredBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  caption: { fontSize: 11, color: Colors.textMuted, paddingHorizontal: 8, paddingBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
