import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Space } from '../../constants/tokens';
import { messageService } from '../../services/messageService';
import { absUrl } from '../../services/api';

export function MessagesScreen() {
  const nav = useNavigation();
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
          renderItem={({ item }: { item: any }) => {
            const other = item.with?.[0];
            const name = other?.name ?? other?.username ?? 'Kullanıcı';
            const username = other?.username;
            const avatarUrl = absUrl(other?.avatarUrl);
            const lastBody = item.lastMessage?.body ?? '';
            const lastAt = item.lastMessageAt
              ? new Date(item.lastMessageAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <Pressable
                style={({ pressed }) => [styles.thread, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => (nav as any).navigate('Conversation', {
                  conversationId: item.id,
                  otherName: name,
                  otherUsername: username,
                  otherAvatarUrl: avatarUrl,
                })}
              >
                <MettloAvatar uri={avatarUrl} name={name} size={52} />
                <View style={styles.threadBody}>
                  <View style={styles.threadTop}>
                    <View style={{ flex: 1 }}>
                      <MettloText style={styles.displayName} numberOfLines={1}>{name}</MettloText>
                      {username && (
                        <MettloText style={styles.usernameText} numberOfLines={1}>@{username}</MettloText>
                      )}
                    </View>
                    <MettloText style={styles.timeText}>{lastAt}</MettloText>
                  </View>
                  <MettloText variant="bodySm" color={Colors.textMuted} numberOfLines={1} style={{ marginTop: 2 }}>
                    {item.lastMessage?.mine ? 'Sen: ' : ''}{lastBody}
                  </MettloText>
                </View>
                {item.unread && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s12 },
  list: { paddingHorizontal: Space.s16, gap: Space.s2 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: Space.s14, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  threadBody: { flex: 1, gap: Space.s2 },
  threadTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  displayName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  usernameText: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  timeText: { fontSize: 12, color: Colors.textMuted, marginLeft: Space.s8, marginTop: 2 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, flexShrink: 0 },
});
