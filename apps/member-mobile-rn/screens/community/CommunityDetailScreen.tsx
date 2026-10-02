import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { communityService } from '../../services/communityService';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'CommunityDetail'>;

export function CommunityDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { slug } = route.params;
  const [comment, setComment] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts', slug],
    queryFn: () => communityService.getPosts(slug),
  });

  const list = posts?.items ?? posts?.posts ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </Pressable>
        <MettloText variant="h4">Topluluk</MettloText>
      </View>

      {isLoading ? <MettloLoadingState /> : list.length === 0 ? (
        <MettloEmptyState icon="📝" title="Henüz gönderi yok" description="İlk gönderiyi sen yap!" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(p: any) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.post}>
              <View style={styles.postHeader}>
                <MettloAvatar uri={item.authorAvatarUrl} name={item.authorName} size={36} />
                <View style={styles.postMeta}>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }}>{item.authorName}</MettloText>
                  <MettloText variant="caption" color={Colors.textMuted}>{item.createdAt}</MettloText>
                </View>
              </View>
              <MettloText variant="body" color={Colors.textSecondary}>{item.content}</MettloText>
              <View style={styles.postActions}>
                <Pressable style={styles.action}>
                  <MettloText variant="caption" color={Colors.textMuted}>❤ {item.likeCount ?? 0}</MettloText>
                </Pressable>
                <Pressable style={styles.action}>
                  <MettloText variant="caption" color={Colors.textMuted}>💬 {item.commentCount ?? 0}</MettloText>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={() => { if (comment.trim()) { communityService.createPost(slug, { content: comment }); setComment(''); } }}>
            <MettloText color={Colors.primary} style={{ fontWeight: '700' }}>Gönder</MettloText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.s16, paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s8 },
  list: { padding: Space.s16, gap: Space.s16 },
  post: { backgroundColor: Colors.surface1, borderRadius: Radius.card, padding: Space.s14, gap: Space.s10, borderWidth: 1, borderColor: Colors.borderSubtle },
  postHeader: { flexDirection: 'row', gap: Space.s10, alignItems: 'center' },
  postMeta: { flex: 1 },
  postActions: { flexDirection: 'row', gap: Space.s16, marginTop: Space.s4 },
  action: { paddingVertical: Space.s4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Space.s12, gap: Space.s10, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, backgroundColor: Colors.surface1 },
  input: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, paddingVertical: Space.s10, color: Colors.textPrimary, fontSize: 15, maxHeight: 100 },
  sendBtn: { paddingHorizontal: Space.s12, paddingVertical: Space.s10 },
});
