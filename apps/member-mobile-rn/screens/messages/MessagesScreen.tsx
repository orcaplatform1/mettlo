import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { messageService } from '../../services/messageService';

export function MessagesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['message-threads'],
    queryFn: () => messageService.threads(),
  });

  const threads = data?.items ?? data?.threads ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MettloText variant="h2">Mesajlar</MettloText>
      </View>

      {isLoading ? <MettloLoadingState /> : threads.length === 0 ? (
        <MettloEmptyState icon="✉️" title="Henüz mesaj yok" description="Koçlarla veya üyelerle mesajlaşmaya başla." />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t: any) => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <Pressable style={({ pressed }) => [styles.thread, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => {/* TODO: navigate to thread */}}>
              <MettloAvatar uri={item.otherAvatarUrl} name={item.otherName} size={50} />
              <View style={styles.threadBody}>
                <View style={styles.threadTop}>
                  <MettloText variant="h5">{item.otherName}</MettloText>
                  <MettloText variant="caption" color={Colors.textMuted}>{item.lastAt}</MettloText>
                </View>
                <MettloText variant="bodySm" color={Colors.textMuted} numberOfLines={1}>{item.lastMessage}</MettloText>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadDot}>
                  <MettloText variant="caption" style={styles.unreadText}>{item.unreadCount}</MettloText>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s12 },
  list: { paddingHorizontal: Space.s16, gap: Space.s2 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: Space.s14, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  threadBody: { flex: 1, gap: Space.s4 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadDot: { backgroundColor: Colors.primary, borderRadius: Radius.pill, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space.s6 },
  unreadText: { color: '#fff', fontWeight: '700' },
});
