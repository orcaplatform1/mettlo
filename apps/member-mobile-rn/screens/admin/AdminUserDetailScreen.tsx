import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api, absUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AdminUserDetail'>;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Kurucu', ADMIN: 'Yönetici', MODERATOR: 'Topluluk Kontrolörü',
  SUPPORT: 'Müşteri İlişkileri', CREATOR: 'Koç', SUBSCRIBER: 'Abone', MEMBER: 'Üye', BUSINESS: 'İşletme',
};
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#EF4444', ADMIN: '#10B981', MODERATOR: '#F59E0B',
  SUPPORT: '#C084FC', CREATOR: '#10B981', SUBSCRIBER: '#F59E0B', MEMBER: Colors.textMuted, BUSINESS: '#6366F1',
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif', PENDING: 'Beklemede', SUSPENDED: 'Askıda', BANNED: 'Banlı', REJECTED: 'Reddedildi',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10B981', PENDING: '#F59E0B', SUSPENDED: '#F97316', BANNED: '#EF4444', REJECTED: '#6B7280',
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <MettloText style={styles.infoLabel}>{label}</MettloText>
      <MettloText style={styles.infoValue}>{String(value)}</MettloText>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <MettloText variant="caption" color={Colors.textMuted} style={styles.sectionTitle}>{title}</MettloText>;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <MettloText style={styles.statVal}>{value}</MettloText>
      <MettloText style={styles.statLabel}>{label}</MettloText>
    </View>
  );
}

export function AdminUserDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const currentUser = useAuthStore(s => s.user);
  const isSuperAdmin = ((currentUser as any)?.role ?? '').toUpperCase() === 'SUPER_ADMIN';

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await api.get(`/admin/users/${params.userId}`);
      setUser(res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [params.userId]);

  useEffect(() => { load(); }, [load]);

  async function handleWarn() {
    Alert.prompt('Uyarı Gönder', 'Uyarı mesajını girin:', async (msg) => {
      if (!msg?.trim()) return;
      setActionLoading(true);
      try {
        await api.post(`/admin/users/${params.userId}/sanctions`, { type: 'WARN', reason: msg.trim() });
        Alert.alert('Başarılı', 'Uyarı gönderildi.');
        load(true);
      } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.'); }
      finally { setActionLoading(false); }
    });
  }

  async function handleSuspend() {
    if (!isSuperAdmin) return Alert.alert('Yetki Yok', 'Bu işlem için Kurucu yetkisi gerekir.');
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
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.'); }
    finally { setActionLoading(false); }
  }

  async function handleBan() {
    if (!isSuperAdmin) return Alert.alert('Yetki Yok', 'Bu işlem için Kurucu yetkisi gerekir.');
    Alert.alert('Hesabı Banla', 'Bu kullanıcıyı kalıcı olarak banlamak istediğinizden emin misiniz?', [
      {
        text: 'Banla', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await api.post(`/admin/users/${params.userId}/sanctions`, { type: 'BAN' });
            Alert.alert('Başarılı', 'Kullanıcı banlandı.');
            load(true);
          } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.'); }
          finally { setActionLoading(false); }
        }
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  async function handleLiftSanction() {
    if (!isSuperAdmin) return Alert.alert('Yetki Yok', 'Bu işlem için Kurucu yetkisi gerekir.');
    setActionLoading(true);
    try {
      const sanctions = user?.sanctions ?? [];
      const active = sanctions.find((s: any) => s.status === 'ACTIVE');
      if (active) {
        await api.post(`/admin/sanctions/${active.id}/lift`);
        Alert.alert('Başarılı', 'Yaptırım kaldırıldı.');
        load(true);
      } else {
        Alert.alert('Bilgi', 'Aktif yaptırım bulunamadı.');
      }
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.'); }
    finally { setActionLoading(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  if (!user) return <View style={styles.center}><MettloText color={Colors.textMuted}>Kullanıcı bulunamadı</MettloText></View>;

  const isBanned = user.status === 'BANNED';
  const isSuspended = user.status === 'SUSPENDED';
  const hasSanction = isBanned || isSuspended;
  const social = user.social ?? {};
  const personal = user.personal;
  const creator = user.creatorProfile;
  const member = user.memberProfile;
  const activeSanction = (user.sanctions ?? []).find((s: any) => s.status === 'ACTIVE');

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
        {/* Profil kartı */}
        <View style={styles.profileCard}>
          <MettloAvatar uri={absUrl(user.avatarUrl)} name={user.name} size={72} role={user.role} verified={user.role === 'CREATOR' || user.role === 'BUSINESS'} tappable username={user.username} />
          <MettloText variant="h3" style={{ marginTop: Space.s8 }}>{user.name}</MettloText>
          <MettloText color={Colors.textMuted}>@{user.username}</MettloText>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: `${ROLE_COLORS[user.role] ?? Colors.textMuted}20` }]}>
              <MettloText style={[styles.tagText, { color: ROLE_COLORS[user.role] ?? Colors.textMuted }]}>{ROLE_LABELS[user.role] ?? user.role}</MettloText>
            </View>
            <View style={[styles.tag, { backgroundColor: `${STATUS_COLORS[user.status] ?? '#999'}20` }]}>
              <MettloText style={[styles.tagText, { color: STATUS_COLORS[user.status] ?? '#999' }]}>{STATUS_LABELS[user.status] ?? user.status}</MettloText>
            </View>
            {user.role === 'SUBSCRIBER' && (
              <View style={[styles.tag, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                <MettloText style={[styles.tagText, { color: Colors.primary }]}>⭐ Premium</MettloText>
              </View>
            )}
          </View>
          {/* Profil sayfasına git butonu */}
          {user.role === 'CREATOR' && (
            <TouchableOpacity style={styles.profileBtn} onPress={() => (nav as any).navigate('CoachDetail', { username: user.username })}>
              <MettloText style={styles.profileBtnText}>Koç Profilini Gör →</MettloText>
            </TouchableOpacity>
          )}
        </View>

        {/* Sosyal istatistikler */}
        <View style={styles.card}>
          <SectionTitle title="SOSYAL" />
          <View style={styles.statsRow}>
            <StatBox label="XP" value={social.xp ?? 0} />
            <StatBox label="Takipçi" value={social.followers ?? 0} />
            <StatBox label="Takip" value={social.following ?? 0} />
            <StatBox label="Gönderi" value={social.posts ?? 0} />
            <StatBox label="Mesaj" value={social.messagesSent ?? 0} />
          </View>
        </View>

        {/* Hesap bilgileri */}
        <View style={styles.card}>
          <SectionTitle title="HESAP BİLGİLERİ" />
          <InfoRow label="E-posta" value={user.email} />
          <InfoRow label="E-posta Doğrulama" value={user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString('tr-TR') : 'Doğrulanmamış'} />
          <InfoRow label="Son Giriş" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR') : '-'} />
          <InfoRow label="Kayıt Tarihi" value={new Date(user.createdAt).toLocaleDateString('tr-TR')} />
          <InfoRow label="2FA" value={user.twoFactorEnabled ? 'Aktif' : 'Kapalı'} />
          {user.birthDate && <InfoRow label="Doğum Tarihi" value={new Date(user.birthDate).toLocaleDateString('tr-TR')} />}
        </View>

        {/* Kişisel bilgiler — sadece superadmin */}
        {isSuperAdmin && personal && (
          <View style={styles.card}>
            <SectionTitle title="KİŞİSEL BİLGİLER" />
            <InfoRow label="Tam Ad" value={personal.fullName} />
            <InfoRow label="Telefon" value={personal.phone} />
            <InfoRow label="Cinsiyet" value={personal.gender} />
            <InfoRow label="Şehir" value={personal.city} />
            <InfoRow label="İlçe" value={personal.district} />
            <InfoRow label="Posta Kodu" value={personal.postalCode} />
            <InfoRow label="Adres" value={personal.address} />
            <InfoRow label="Acil Kişi" value={personal.emergencyContact} />
            <InfoRow label="Kayıt IP" value={personal.registrationIp} />
          </View>
        )}

        {/* Üye profili */}
        {member && (
          <View style={styles.card}>
            <SectionTitle title="ÜYE PROFİLİ" />
            <InfoRow label="Hedef" value={member.goal} />
            <InfoRow label="Fitness Seviyesi" value={member.fitnessLevel} />
            <InfoRow label="Tercih" value={member.preferredTrainingType} />
          </View>
        )}

        {/* Koç profili */}
        {creator && (
          <View style={styles.card}>
            <SectionTitle title="KOÇ PROFİLİ" />
            <InfoRow label="Görünen Ad" value={creator.displayName} />
            <InfoRow label="Başlık" value={creator.headline} />
            <InfoRow label="Durum" value={creator.status} />
            <InfoRow label="Doğrulandı" value={creator.verified ? 'Evet' : 'Hayır'} />
            <InfoRow label="Abone Sayısı" value={creator.subscribersCount} />
            <InfoRow label="Puan" value={creator.ratingAvg ? `${parseFloat(String(creator.ratingAvg)).toFixed(1)} / 5` : '-'} />
            <InfoRow label="Kariyer Başlangıcı" value={creator.careerStartYear} />
          </View>
        )}

        {/* Abonelikler & Ödemeler */}
        <View style={styles.card}>
          <SectionTitle title="ABONELİK & ÖDEME" />
          <InfoRow label="Abonelik Sayısı" value={(user.subscriptions ?? []).length} />
          <InfoRow label="Ödeme Sayısı" value={(user.payments ?? []).length} />
          <InfoRow label="Sipariş Sayısı" value={(user.orders ?? []).length} />
          <InfoRow label="Fatura Sayısı" value={(user.invoices ?? []).length} />
          {(user.subscriptions ?? []).length > 0 && (
            <View style={{ marginTop: Space.s8 }}>
              {(user.subscriptions as any[]).slice(0, 3).map((s: any) => (
                <View key={s.id} style={styles.subRow}>
                  <MettloText style={styles.subText}>{s.plan?.name ?? '-'} · {s.status}</MettloText>
                  <MettloText style={styles.subDate}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('tr-TR') : ''}</MettloText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Aktivite */}
        {user.activity && (
          <View style={styles.card}>
            <SectionTitle title="AKTİVİTE" />
            <View style={styles.statsRow}>
              <StatBox label="Antrenman" value={(user.activity.workoutLogs ?? []).length} />
              <StatBox label="Program" value={(user.activity.programs ?? []).length} />
              <StatBox label="Challenge" value={(user.activity.challenges ?? []).length} />
              <StatBox label="Rezervasyon" value={(user.activity.bookings ?? []).length} />
              <StatBox label="Canlı" value={(user.activity.liveAttendance ?? []).length} />
            </View>
          </View>
        )}

        {/* Aktif yaptırım */}
        {activeSanction && (
          <View style={[styles.card, { borderColor: Colors.error }]}>
            <SectionTitle title="AKTİF YAPTIRIM" />
            <InfoRow label="Tür" value={activeSanction.type} />
            <InfoRow label="Neden" value={activeSanction.reason} />
            <InfoRow label="Bitiş" value={activeSanction.endsAt ? new Date(activeSanction.endsAt).toLocaleDateString('tr-TR') : 'Kalıcı'} />
          </View>
        )}

        {/* Cihazlar */}
        {isSuperAdmin && (user.devices ?? []).length > 0 && (
          <View style={styles.card}>
            <SectionTitle title={`CİHAZLAR (${(user.devices ?? []).length})`} />
            {(user.devices as any[]).slice(0, 3).map((d: any, i: number) => (
              <View key={i} style={styles.subRow}>
                <MettloText style={styles.subText}>{d.platform} · {d.model ?? '-'}</MettloText>
                <MettloText style={styles.subDate}>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleDateString('tr-TR') : ''}</MettloText>
              </View>
            ))}
          </View>
        )}

        {/* Yaptırım işlemleri */}
        <View style={styles.card}>
          <SectionTitle title="YÖNETİM İŞLEMLERİ" />
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
  content: { padding: Space.s16, gap: Space.s14, paddingBottom: 40 },
  profileCard: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s20, alignItems: 'center', gap: Space.s6 },
  tagRow: { flexDirection: 'row', gap: Space.s8, flexWrap: 'wrap', justifyContent: 'center', marginTop: Space.s4 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  tagText: { fontSize: 12, fontWeight: '600' },
  profileBtn: { marginTop: Space.s10, paddingHorizontal: Space.s16, paddingVertical: Space.s8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  profileBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16, gap: Space.s10 },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.8, fontSize: 11, marginBottom: Space.s4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: Colors.textMuted },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8 },
  statBox: { flex: 1, minWidth: 56, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s10, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Space.s4, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  subText: { fontSize: 12, color: Colors.textSecondary },
  subDate: { fontSize: 11, color: Colors.textMuted },
  actions: { gap: Space.s10 },
});
