import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TR: Record<string, string> = { OPEN: 'Açık', ANSWERED: 'Yanıtlandı', CLOSED: 'Kapatıldı', TIMED_OUT: 'Zaman Aşımı' };

export function SupportDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<any>();
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function load() {
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setTicket(res.data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function sendReply() {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/support/tickets/${ticketId}/messages`, { body: reply.trim() });
      setReply('');
      await load();
    } catch {}
    finally { setSending(false); }
  }

  async function closeTicket() {
    try {
      await api.post(`/support/tickets/${ticketId}/close`);
      await load();
    } catch {}
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const isClosed = ticket?.status === 'CLOSED' || ticket?.status === 'TIMED_OUT';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>#{ticket?.number}</MettloText>
        {!isClosed && (
          <TouchableOpacity onPress={closeTicket}>
            <MettloText style={{ color: Colors.textMuted, fontSize: 13 }}>Kapat</MettloText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.meta}>
        <MettloText style={{ fontWeight: '600' }}>{ticket?.subject}</MettloText>
        <View style={[styles.badge, { backgroundColor: `${isClosed ? Colors.textMuted : Colors.primary}20` }]}>
          <MettloText style={[styles.badgeText, { color: isClosed ? Colors.textMuted : Colors.primary }]}>{STATUS_TR[ticket?.status] ?? ticket?.status}</MettloText>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={ticket?.messages ?? []}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: Space.s16, gap: Space.s10, paddingBottom: 20 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: m }) => {
            const isMe = m.from === 'me';
            const isSystem = m.from === 'system';
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : isSystem ? styles.bubbleSystem : styles.bubbleSupport]}>
                {!isMe && !isSystem && (
                  <MettloText style={styles.fromLabel}>Destek</MettloText>
                )}
                <MettloText style={[styles.bubbleText, isMe ? styles.bubbleTextMe : {}] as any}>{m.body}</MettloText>
                <MettloText style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : {}] as any}>{new Date(m.createdAt).toLocaleString('tr-TR', { timeStyle: 'short', dateStyle: 'short' })}</MettloText>
              </View>
            );
          }}
        />

        {!isClosed && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Mesajınızı yazın…"
              placeholderTextColor={Colors.textMuted}
              value={reply}
              onChangeText={setReply}
              multiline
              maxLength={4000}
            />
            <TouchableOpacity style={[styles.sendBtn, (!reply.trim() || sending) && { opacity: 0.4 }]} onPress={sendReply} disabled={!reply.trim() || sending}>
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <MettloText style={{ color: '#fff', fontWeight: '600' }}>Gönder</MettloText>}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s16, paddingVertical: Space.s10, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bubble: { maxWidth: '80%', borderRadius: Radius.md, padding: Space.s12, gap: 4 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleSupport: { alignSelf: 'flex-start', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  bubbleSystem: { alignSelf: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle, maxWidth: '90%' },
  fromLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  bubbleText: { fontSize: 14, color: Colors.textPrimary },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, gap: Space.s10 },
  input: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, paddingVertical: Space.s10, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle, maxHeight: 120 },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Space.s16, paddingVertical: Space.s12, alignItems: 'center', justifyContent: 'center' },
});
