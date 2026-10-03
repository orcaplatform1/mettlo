import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_TR: Record<string, string> = { NEW: 'Yeni', READ: 'Okundu', REPLIED: 'Yanıtlandı', ARCHIVED: 'Arşiv' };
const STATUS_COLORS: Record<string, string> = { NEW: Colors.primary, READ: Colors.textMuted, REPLIED: Colors.success, ARCHIVED: Colors.textMuted };
const CAT_TR: Record<string, string> = { general: 'Genel', partnership: 'İş ortaklığı', coach: 'Koç', press: 'Basın', legal: 'Hukuki / KVKK', other: 'Diğer' };
const FILTERS = [['', 'Tümü'], ['NEW', 'Yeni'], ['READ', 'Okundu'], ['REPLIED', 'Yanıtlandı'], ['ARCHIVED', 'Arşiv']];

export function AdminContactScreen() {
  const nav = useNavigation();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async (s: string, query: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (s) params.status = s;
      if (query) params.q = query;
      const res = await api.get('/admin/contact-messages', { params });
      setMessages(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(status, q); }, [status]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">İletişim Mesajları</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Konu, ad veya e-posta…"
          placeholderTextColor={Colors.textMuted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => load(status, q)}
          returnKeyType="search"
          autoCapitalize="none"
        />
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
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<MettloText style={styles.empty}>Mesaj yok</MettloText>}
          renderItem={({ item: m }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>{m.subject}</MettloText>
                <MettloText style={styles.caption}>{m.name} · {m.email}</MettloText>
                <MettloText style={styles.caption}>{CAT_TR[m.category] ?? m.category} · {new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</MettloText>
              </View>
              <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[m.status] ?? Colors.textMuted}20` }]}>
                <MettloText style={[styles.badgeText, { color: STATUS_COLORS[m.status] ?? Colors.textMuted }]}>{STATUS_TR[m.status] ?? m.status}</MettloText>
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
  searchWrap: { paddingHorizontal: Space.s16, paddingTop: Space.s10 },
  search: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 44, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
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
