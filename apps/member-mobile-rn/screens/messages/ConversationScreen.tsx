import React, { useState, useRef, useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { messageService } from '../../services/messageService';
import { absUrl } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'Conversation'>;

export function ConversationScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { conversationId, otherName, otherUsername, otherAvatarUrl, otherRole } = route.params;
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messageService.getThread(conversationId),
    refetchInterval: 5000,
  });

  const sendMut = useMutation({
    mutationFn: (body: string) => messageService.send(conversationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
      qc.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });

  useEffect(() => {
    if ((messages as any[]).length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [(messages as any[]).length]);

  const handleSend = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    sendMut.mutate(body);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={styles.backBtn}>
          <MettloText color={Colors.textMuted} style={{ fontSize: 20 }}>←</MettloText>
        </Pressable>
        <Pressable
          style={styles.headerPressable}
          onPress={() => otherUsername && (nav as any).navigate('CoachDetail', { username: otherUsername })}
          hitSlop={4}
        >
          <MettloAvatar uri={otherAvatarUrl ?? absUrl(undefined)} name={otherName} size={36} role={otherRole} verified={otherRole === 'CREATOR' || otherRole === 'BUSINESS'} />
          <View style={styles.headerInfo}>
            <MettloText style={styles.headerName} numberOfLines={1}>{otherName ?? 'Mesaj'}</MettloText>
            {otherUsername && <MettloText style={styles.headerUser}>@{otherUsername}</MettloText>}
          </View>
        </Pressable>
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <FlatList
          ref={flatRef}
          data={messages as any[]}
          keyExtractor={(m: any) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const isMine = item.mine;
            const senderAvatar = absUrl(item.sender?.avatarUrl);
            const senderName = item.sender?.name ?? item.sender?.username ?? '';

            if (isMine) {
              return (
                <View style={styles.rowRight}>
                  <View style={[styles.bubble, styles.bubbleMe]}>
                    {item.deleted ? (
                      <MettloText style={styles.deletedText}>Bu mesaj silindi</MettloText>
                    ) : (
                      <MettloText style={styles.bubbleTextMe}>{item.body}</MettloText>
                    )}
                    <MettloText style={styles.timeMe}>
                      {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </MettloText>
                  </View>
                </View>
              );
            }

            return (
              <View style={styles.rowLeft}>
                <MettloAvatar uri={senderAvatar} name={senderName} size={32} role={item.sender?.role} verified={item.sender?.role === 'CREATOR' || item.sender?.role === 'BUSINESS'} />
                <View style={[styles.bubble, styles.bubbleOther]}>
                  {item.deleted ? (
                    <MettloText style={styles.deletedText}>Bu mesaj silindi</MettloText>
                  ) : (
                    <MettloText style={styles.bubbleTextOther}>{item.body}</MettloText>
                  )}
                  <MettloText style={styles.timeOther}>
                    {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </MettloText>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sendMut.isPending}
          >
            <MettloText style={styles.sendText}>↑</MettloText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.s10, paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  headerPressable: { flexDirection: 'row', alignItems: 'center', gap: Space.s10, flex: 1 },
  backBtn: { marginRight: Space.s4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  headerUser: { fontSize: 12, color: Colors.textMuted },
  list: { padding: Space.s16, gap: Space.s10, paddingBottom: Space.s20 },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end' },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: Space.s8 },
  bubble: { maxWidth: '75%', borderRadius: Radius.lg, padding: Space.s10, paddingHorizontal: Space.s14 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.surface2, borderBottomLeftRadius: 4 },
  bubbleTextMe: { color: '#fff', fontSize: 15 },
  bubbleTextOther: { color: Colors.textPrimary, fontSize: 15 },
  deletedText: { fontStyle: 'italic', color: Colors.textMuted, fontSize: 14 },
  timeMe: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: Space.s4, alignSelf: 'flex-end' },
  timeOther: { fontSize: 11, color: Colors.textMuted, marginTop: Space.s4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Space.s12, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, gap: Space.s8 },
  input: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.lg, paddingHorizontal: Space.s14, paddingVertical: Space.s10, color: Colors.textPrimary, fontSize: 15, maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
