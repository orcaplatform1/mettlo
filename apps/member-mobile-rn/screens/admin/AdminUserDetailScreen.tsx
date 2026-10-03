import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AdminUserDetail'>;

interface UserDetail {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  isPremium: boolean;
  isCoach?: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
  suspendedUntil?: string;
  xp?: number;
  streakDays?: number;
  createdAt: string;
  birthDate?: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin', ADMIN: 'Admin', MODERATOR: 'Moderatör',
  SUPPORT: 'Destek', CREATOR: 'Koç', SUBSCRIBER: 'Abone', MEMBER: 'Üye', BUSINESS: 'İşletme',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <MettloText style={styles.infoLabel}>{label}</MettloText>
      <MettloText style={styles.infoValue}>{value}</MettloText>
    </View>
  );
}

export function AdminUserDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const currentUser = useAuthStore(s => s.user);
  const isSuperAdmin = ((currentUser as any)?.role ?? '').toUpperCase() === 'SUPER_ADMIN';

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get<UserDetail>(`/admin/users/${params.userId}`);
      setUser(res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [params.userId]);

  useEffect(() => { load(); }, [load]);

  async function handleWarn() {
    Alert.prompt('Uyarı gönder', 'Uyarı mesajı girin:', async (msg) => {
      if (!msg?.trim()) return;
      setActionLoading(true);
      try {
        await api.post(`/admin/users/${params.userId}/sanctions`, { type: 'WARN', reason: msg.trim() });
        Alert.alert('Başarılı', 'Uyarı gönderildi.');
        load(true);
      } catch (e: any) {
        Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
      } finally { setActionLoading(false); }
    });
  }

  async function handleSuspend() {
    if (!isSuperAdmin) return Alert.alert('Yetki Yok', 'Bu işlem için Süper Admin yetkisi gerekir.');
    Alert.alert('Askıya Al', 'Süre seçin:', [
      { text: '1 Gün', onPress: () => suspend(1) },
      { text: '7 Gün', onPress: () => suspend(7) },
      { text: '30 Gün', onPress: () => suspend(30) },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  async function suspend(days: number) {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${params.userId}/sanctions`, { type: 'SUSPEND', durationDays: days });
      Alert.alert('Başarılı', `${days} gün askıya alındı.`);
      load(true);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionLoading(false); }
  }

  async function handleBan() {
    if (!isSuperAdmin) return Alert.alert('Yetki Yok', 'Bu işlem için Süper Admin yetkisi gerekir.');
    Alert.alert('Hesabı Banla', 'Bu kullanıcıyı kalıcı olarak banlamak istediğinizden emin misiniz?', [
      {
        text: 'Banla', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await api.post(`/admin/users/${params.userId}/sanctions`, { type: 'BAN' });
            Alert.alert('Başarılı', 'Kullanıcı banlı.');
            load(true);
          } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
          } finally { setActionLoading(false); }
        }
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  async function handleLiftSanction() {
    if (!isSuperAdmin) return Alert.alert('Yetki Yok', 'Bu işlem için Süper Admin yetkisi gerekir.');
    setActionLoading(true);
    try {
      const res = await api.get(`/admin/users/${params.userId}`);
      const sanctionId = (res.data as any).activeSanctionId;
      if (sanctionId) {
        await api.post(`/admin/sanctions/${sanctionId}/lift`);
        Alert.alert('Başarılı', 'Yaptırım kaldırıldı.');
        load(true);
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setActionLoading(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  if (!user) return <View style={styles.center}><MettloText color={Colors.textMuted}>Kullanıcı bulunamadı</MettloText></View>;

  const hasSanction = user.isBanned || user.isSuspended;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Kullanıcı Detayı</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {/* Profil */}
        <View style={styles.profileCard}>
          <MettloAvatar uri={user.avatarUrl} name={user.name} size={64} />
          <MettloText variant="h4">{user.name}</MettloText>
          <MettloText color={Colors.textMuted}>@{user.username}</MettloText>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
              <MettloText style={[styles.tagText, { color: Colors.primary }]}>{ROLE_LABELS[user.role] ?? user.role}</MettloText>
            </View>
            {user.isPremium && <View style={[styles.tag, { backgroundColor: 'rgba(249,115,22,0.15)' }]}><MettloText style={[styles.tagText, { color: Colors.primary }]}>⭐ Premium</MettloText></View>}
            {user.isBanned && <View style={[styles.tag, { backgroundColor: 'rgba(239,68,68,0.15)' }]}><MettloText style={[styles.tagText, { color: Colors.error }]}>Banlı</MettloText></View>}
            {user.isSuspended && <View style={[styles.tag, { backgroundColor: 'rgba(249,115,22,0.15)' }]}><MettloText style={[styles.tagText, { color: Colors.primary }]}>Askıda</MettloText></View>}
          </View>
        </View>

        {/* Bilgiler — süper admin görür */}
        <View style={styles.card}>
          <MettloText variant="caption" color={Colors.textMuted} style={styles.cardTitle}>BİLGİLER</MettloText>
          <InfoRow label="E-posta" value={isSuperAdmin ? user.email : '***'} />
          <InfoRow label="Telefon" value={isSuperAdmin ? user.phone : '***'} />
          <InfoRow label="Doğum Tarihi" value={isSuperAdmin && user.birthDate ? user.birthDate : undefined} />
          <InfoRow label="Kayıt Tarihi" value={new Date(user.createdAt).toLocaleDateString('tr-TR')} />
          <InfoRow label="XP" value={String(user.xp ?? 0)} />
          <InfoRow label="Streak" value={`${user.streakDays ?? 0} gün`} />
        </View>

        {/* Yaptırım işlemleri */}
        <View style={styles.card}>
          <MettloText variant="caption" color={Colors.textMuted} style={styles.cardTitle}>YAPTIRИМ İŞLEMLERİ</MettloText>
          <View style={styles.actions}>
            <MettloButton label="⚠️ Uyarı Gönder" variant="secondary" onPress={handleWarn} loading={actionLoading} fullWidth />
            {!hasSanction && (
              <>
                <MettloButton label="⏸ Askıya Al" variant="secondary" onPress={handleSuspend} loading={actionLoading} fullWidth />
                <MettloButton label="🚫 Banla" variant="danger" onPress={handleBan} loading={actionLoading} fullWidth />
              </>
            )}
            {hasSanction && (
              <MettloButton label="✅ Yaptırımı Kaldır" variant="secondary" onPress={handleLiftSanction} loading={actionLoading} fullWidth />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  content: { padding: Space.s16, gap: Space.s16 },
  profileCard: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s20, alignItems: 'center', gap: Space.s8 },
  tagRow: { flexDirection: 'row', gap: Space.s8, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  tagText: { fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s12 },
  cardTitle: { fontWeight: '700', letterSpacing: 0.8, fontSize: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: Colors.textMuted },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  actions: { gap: Space.s10 },
});
