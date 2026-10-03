import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function CreatorInvitesScreen() {
  const nav = useNavigation();
  const qc = useQueryClient();
  const [username, setUsername] = useState('');
  const [days, setDays] = useState('14');
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['creator-invites'],
    queryFn: async () => {
      const res = await api.get('/creators/me/invites');
      return res.data;
    },
  });

  async function sendInvite() {
    if (!username.trim()) { Alert.alert('Eksik', 'Kullanıcı adını gir'); return; }
    setSending(true);
    try {
      await api.post('/creators/me/invites', { username: username.trim().replace('@', ''), days: parseInt(days) || 14 });
      qc.invalidateQueries({ queryKey: ['creator-invites'] });
      setUsername('');
      Alert.alert('Davet Gönderildi', 'Kullanıcı davet edildi');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Davet gönderilemedi');
    } finally { setSending(false); }
  }

  const invites: any[] = data?.invites ?? [];
  const used: number = data?.used ?? 0;
  const quota: number = data?.quota ?? 0;
  const remaining: number = data?.remaining ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Ücretsiz Davetler</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <>
          <View style={styles.quotaCard}>
            <MettloText style={styles.quotaText}>Kota: <MettloText style={{ fontWeight: '700' }}>{used} / {quota}</MettloText> kullanıldı</MettloText>
            <MettloText style={{ color: Colors.primary, fontWeight: '700', fontSize: 18 }}>{remaining} davet kaldı</MettloText>
          </View>

          {remaining > 0 && (
            <View style={styles.form}>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Kullanıcı adı"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { width: 70 }]}
                  value={days}
                  onChangeText={setDays}
                  keyboardType="number-pad"
                  placeholder="Gün"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.5 }]} onPress={sendInvite} disabled={sending}>
                  {sending ? <ActivityIndicator color="#fff" size="small" /> : <MettloText style={{ color: '#fff', fontWeight: '600' }}>Gönder</MettloText>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <FlatList
            data={invites}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={<MettloText style={styles.empty}>Henüz davet yok</MettloText>}
            renderItem={({ item: inv }) => {
              const accepted = !!inv.acceptedAt;
              const expired = !accepted && new Date(inv.expiresAt) < new Date();
              return (
                <View style={styles.invRow}>
                  <View style={{ flex: 1 }}>
                    <MettloText style={styles.caption}>/invite/{inv.token?.slice(0, 12)}…</MettloText>
                    <MettloText style={styles.caption}>{inv.days} gün · Son: {new Date(inv.expiresAt).toLocaleDateString('tr-TR')}</MettloText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: accepted ? 'rgba(34,197,94,0.15)' : expired ? 'rgba(100,100,100,0.15)' : 'rgba(249,115,22,0.15)' }]}>
                    <MettloText style={[styles.badgeText, { color: accepted ? Colors.success : expired ? Colors.textMuted : Colors.primary }]}>
                      {accepted ? 'Kabul edildi' : expired ? 'Süresi doldu' : 'Bekliyor'}
                    </MettloText>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  quotaCard: { backgroundColor: Colors.surface2, margin: Space.s12, borderRadius: Radius.md, padding: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle, gap: Space.s4 },
  quotaText: { fontSize: 14, color: Colors.textSecondary },
  form: { paddingHorizontal: Space.s12, marginBottom: Space.s4 },
  row: { flexDirection: 'row', gap: Space.s8, alignItems: 'center' },
  input: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s12, height: 44, color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.borderSubtle },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 44, paddingHorizontal: Space.s14, alignItems: 'center', justifyContent: 'center' },
  invRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textMuted, paddingVertical: Space.s32 },
});
