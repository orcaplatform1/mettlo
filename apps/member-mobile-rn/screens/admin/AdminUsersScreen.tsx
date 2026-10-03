import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isPremium: boolean;
  createdAt: string;
  isBanned?: boolean;
  isSuspended?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#EF4444',
  ADMIN: '#F97316',
  MODERATOR: '#8B5CF6',
  SUPPORT: '#3B82F6',
  CREATOR: '#10B981',
  SUBSCRIBER: '#F59E0B',
  MEMBER: Colors.textMuted,
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  ADMIN: 'Admin',
  MODERATOR: 'Moderatör',
  SUPPORT: 'Destek',
  CREATOR: 'Koç',
  SUBSCRIBER: 'Abone',
  MEMBER: 'Üye',
  BUSINESS: 'İşletme',
};

const FILTERS = ['Tümü', 'Üye', 'Abone', 'Koç', 'Admin', 'Banlı'];

export function AdminUsersScreen() {
  const nav = useNavigation<Nav>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tümü');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roleMap: Record<string, string> = { 'Üye': 'MEMBER', 'Abone': 'SUBSCRIBER', 'Koç': 'CREATOR', 'Admin': 'ADMIN', 'Banlı': '' };

  const fetchUsers = useCallback(async (p: number, q: string, f: string, replace = false) => {
    try {
      const params: any = { page: p, limit: 20 };
      if (q) params.q = q;
      if (f === 'Banlı') params.banned = true;
      else if (roleMap[f]) params.role = roleMap[f];
      const res = await api.get<{ items: User[]; total: number }>('/admin/users', { params });
      const list = res.data.items ?? [];
      setUsers(prev => replace ? list : [...prev, ...list]);
      setHasMore(list.length === 20);
      setPage(p);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setUsers([]);
    fetchUsers(1, search, filter, true);
  }, [filter]);

  function onSearchChange(v: string) {
    setSearch(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setLoading(true);
      setUsers([]);
      fetchUsers(1, v, filter, true);
    }, 400);
  }

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchUsers(page + 1, search, filter);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Kullanıcılar</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="İsim, kullanıcı adı, e-posta…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <MettloText style={[styles.chipText, filter === f && styles.chipTextActive] as any}>{f}</MettloText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<MettloText style={styles.empty}>Kullanıcı bulunamadı</MettloText>}
          renderItem={({ item: u }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.75}
              onPress={() => nav.navigate('AdminUserDetail', { userId: u.id })}
            >
              <MettloAvatar uri={u.avatarUrl} name={u.name} size={44} />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <MettloText variant="body" style={{ fontWeight: '600' }}>{u.name}</MettloText>
                  {u.isBanned && <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}><MettloText style={[styles.badgeText, { color: Colors.error }]}>Banlı</MettloText></View>}
                  {u.isSuspended && <View style={[styles.badge, { backgroundColor: 'rgba(249,115,22,0.15)' }]}><MettloText style={[styles.badgeText, { color: Colors.primary }]}>Askıda</MettloText></View>}
                </View>
                <MettloText style={styles.sub}>@{u.username} · {u.email}</MettloText>
                <View style={styles.roleRow}>
                  <View style={[styles.badge, { backgroundColor: `${ROLE_COLORS[u.role] ?? Colors.textMuted}20` }]}>
                    <MettloText style={[styles.badgeText, { color: ROLE_COLORS[u.role] ?? Colors.textMuted }]}>{ROLE_LABELS[u.role] ?? u.role}</MettloText>
                  </View>
                  {u.isPremium && <View style={[styles.badge, { backgroundColor: 'rgba(249,115,22,0.15)' }]}><MettloText style={[styles.badgeText, { color: Colors.primary }]}>⭐ Premium</MettloText></View>}
                </View>
              </View>
              <MettloText color={Colors.textMuted}>›</MettloText>
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
  searchWrap: { paddingHorizontal: Space.s16, paddingVertical: Space.s10 },
  search: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 44, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
  filters: { flexDirection: 'row', paddingHorizontal: Space.s16, gap: Space.s8, marginBottom: Space.s8 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 32 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.s12, paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  info: { flex: 1, gap: Space.s4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s8 },
  sub: { fontSize: 12, color: Colors.textMuted },
  roleRow: { flexDirection: 'row', gap: Space.s6, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
