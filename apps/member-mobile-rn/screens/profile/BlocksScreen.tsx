import React from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function BlocksScreen() {
  const nav = useNavigation();
  const qc = useQueryClient();

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['my-blocks'],
    queryFn: async () => {
      const res = await api.get('/blocks');
      return res.data as any[];
    },
  });

  async function unblock(username: string) {
    Alert.alert('Engeli Kaldır', `@${username} kullanıcısının engelini kaldırmak istiyor musun?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Kaldır', onPress: async () => {
        try {
          await api.delete(`/blocks/${username}`);
          qc.invalidateQueries({ queryKey: ['my-blocks'] });
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
        <MettloText variant="h4">Engellenenler</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : blocks.length === 0 ? (
        <MettloEmptyState title="Engellediğin kullanıcı yok" />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={b => b.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: b }) => {
            const user = b.blocked ?? b;
            return (
              <View style={styles.row}>
                <MettloAvatar uri={user.avatarUrl} name={user.name} size={44} />
                <View style={{ flex: 1 }}>
                  <MettloText style={{ fontWeight: '600' }}>{user.name}</MettloText>
                  <MettloText style={styles.caption}>@{user.username}</MettloText>
                </View>
                <TouchableOpacity style={styles.unblockBtn} onPress={() => unblock(user.username)}>
                  <MettloText style={{ fontSize: 13, color: Colors.error }}>Kaldır</MettloText>
                </TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  unblockBtn: { paddingHorizontal: Space.s12, paddingVertical: Space.s8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error },
});
