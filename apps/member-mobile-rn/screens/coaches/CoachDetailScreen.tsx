import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloErrorState } from '../../components/ui/MettloErrorState';
import { MettloCopyright } from '../../components/ui/MettloCopyright';
import { ProfileStories } from '../../components/ui/ProfileStories';
import { FollowListModal } from '../../components/ui/FollowListModal';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import { coachService } from '../../services/coachService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'CoachDetail'>;
const { width: SW } = Dimensions.get('window');
const COVER_H = 220;
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'] as const;
const isStaffRole = (role?: string) => STAFF_ROLES.includes(role as any);

// ─── Yardımcı bileşenler ──────────────────────────────────────────────────────

function Accordion({ title, count, children }: { title: string; count?: number | null; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={acc.wrap}>
      <Pressable style={acc.row} onPress={() => setOpen((o) => !o)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s8 }}>
          <MettloText variant="bodySm" style={{ fontWeight: '600' }}>{title}</MettloText>
          {count != null && (
            <View style={acc.badge}><MettloText style={acc.badgeTxt}>{count}</MettloText></View>
          )}
        </View>
        <MettloText style={{ color: Colors.primary, fontSize: 18 }}>{open ? '−' : '+'}</MettloText>
      </Pressable>
      {open && children && <View style={acc.content}>{children}</View>}
    </View>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: Space.s8 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onChange(s)} hitSlop={6}>
          <MettloText style={{ fontSize: 32, color: s <= value ? Colors.warning : Colors.surface3 }}>★</MettloText>
        </Pressable>
      ))}
    </View>
  );
}

function RatingBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? count / max : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s8 }}>
      <MettloText variant="caption" style={{ width: 20, textAlign: 'right', color: Colors.textSecondary }}>{label}</MettloText>
      <MettloText style={{ fontSize: 11, color: Colors.textMuted }}>★</MettloText>
      <View style={{ flex: 1, height: 6, backgroundColor: Colors.surface3, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: Colors.warning, borderRadius: 3 }} />
      </View>
      <MettloText variant="caption" style={{ width: 16, color: Colors.textMuted }}>{count}</MettloText>
    </View>
  );
}

function AdminAccordionAction({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[acc.wrap, { borderColor: 'rgba(236,72,153,0.20)' }]}>
      <Pressable style={acc.row} onPress={() => setOpen((o) => !o)}>
        <MettloText variant="bodySm" style={{ fontWeight: '600' }}>{title}</MettloText>
        <MettloText style={{ color: Colors.primary, fontSize: 18 }}>{open ? '−' : '+'}</MettloText>
      </Pressable>
      {open && <View style={acc.content}>{children}</View>}
    </View>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────────────────────

export function CoachDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { username } = route.params;
  const me = useAuthStore((s) => s.user);
  const isSelf = !!me && me.username === username;
  const amStaff = isStaffRole(me?.role);
  const amSuperAdmin = me?.role === 'SUPER_ADMIN';
  const amAdminPlus = me?.role === 'SUPER_ADMIN' || me?.role === 'ADMIN';

  // Takip state
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowers, setLocalFollowers] = useState<number | null>(null);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);

  // Online / block state
  const [onlineStatus, setOnlineStatus] = useState<'online' | 'offline' | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  // Şikayet modal
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Rating form
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  // Admin data
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [adminBasicData, setAdminBasicData] = useState<any>(null); // /staff (hızlı, audit log yok)
  const [adminData, setAdminData] = useState<any>(null);           // full (yavaş, audit log var)
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);

  // Admin inbox modal
  const [inboxVisible, setInboxVisible] = useState(false);
  const [inboxData, setInboxData] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coach-profile', username],
    queryFn: () => coachService.getProfile(username),
  });

  const { data: classes } = useQuery({
    queryKey: ['coach-classes', username],
    queryFn: () => coachService.getClasses(username),
    initialData: [] as any[],
  });

  // Takip durumu
  useEffect(() => {
    if (isSelf) return;
    userService
      .getFollowStatus(username)
      .then((d) => {
        setFollowing(d?.isFollowing ?? d?.following ?? false);
        if (typeof d?.followers === 'number') setLocalFollowers(d.followers);
      })
      .catch(() => setFollowing(false));
  }, [username, isSelf]);

  // localFollowers başlat
  useEffect(() => {
    if (data?.followersCount !== undefined && localFollowers === null) {
      setLocalFollowers(data.followersCount);
    }
  }, [data?.followersCount]); // eslint-disable-line

  // Online durum
  useEffect(() => {
    if (isSelf || !data) return;
    api
      .get(`/presence/status?usernames=${username}`)
      .then((r) => setOnlineStatus(r.data?.[username] ?? null))
      .catch(() => null);
  }, [username, isSelf, data]);

  // Block durumu
  useEffect(() => {
    if (isSelf || !me || !data) return;
    api
      .get(`/blocks/status/${username}`)
      .then((r) => setIsBlocked(r.data?.blocked ?? false))
      .catch(() => null);
  }, [username, isSelf, me, data]);

  // Admin verisi — 2 aşama: hızlı /staff (audit yok), sonra arka planda full endpoint
  useEffect(() => {
    if (!amStaff) return;
    setAdminLoadError(null);
    // Aşama 1: hızlı, audit log yazmaz, anında görüntülenir
    api.get(`/admin/profiles/${username}/staff`)
      .then((r) => {
        if (r.data?.id) setAdminUserId(r.data.id);
        setAdminBasicData(r.data);
        // Aşama 2: ağır sorgu — Hesap Verileri ve Kişisel Bilgiler için, arka planda
        api.get(`/admin/profiles/${username}`, { timeout: 60000 })
          .then((r2) => setAdminData(r2.data))
          .catch(() => null); // Hesap Verileri yüklenmezse sessizce atla
      })
      .catch((e: any) => {
        const status = e?.response?.status ?? '?';
        const msg = e?.response?.data?.message ?? e?.message ?? 'Bilinmeyen hata';
        setAdminLoadError(`Hata ${status}: ${msg}`);
      });
  }, [amStaff, username]); // eslint-disable-line

  const applyFollowResult = (res: any, isFollowing: boolean) => {
    setFollowing(isFollowing);
    if (typeof res?.followers === 'number') setLocalFollowers(res.followers);
  };

  const toggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        const res = await userService.unfollow(username);
        applyFollowResult(res, false);
      } else {
        const res = await userService.follow(username);
        applyFollowResult(res, true);
      }
    } catch {}
    setFollowLoading(false);
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowing(isFollowing);
    setLocalFollowers((c) => (c === null ? null : isFollowing ? c + 1 : Math.max(0, c - 1)));
  };

  const handleMessage = async () => {
    if (!me) { (nav as any).navigate('Login'); return; }
    setMsgLoading(true);
    try {
      const res = await api.post('/conversations', { toUsername: username });
      (nav as any).navigate('Conversation', {
        conversationId: res.data.id,
        otherName: data?.displayName ?? data?.name,
        otherUsername: username,
        otherAvatarUrl: data?.avatarUrl,
      });
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message ?? 'Mesaj başlatılamadı.');
    }
    setMsgLoading(false);
  };

  const handleBlock = () => {
    Alert.alert(
      isBlocked ? 'Engeli Kaldır' : 'Engelle',
      isBlocked
        ? `@${username} engelini kaldırmak istiyor musun?`
        : `@${username} hesabını engellemek istiyor musun? Bu kişi seni bulamaz, mesaj gönderemez.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: isBlocked ? 'Engeli Kaldır' : 'Engelle',
          style: 'destructive',
          onPress: async () => {
            setBlockLoading(true);
            try {
              if (isBlocked) {
                await api.delete(`/blocks/${username}`);
                setIsBlocked(false);
              } else {
                await api.post('/blocks', { username });
                setIsBlocked(true);
              }
            } catch (e: any) {
              Alert.alert('Hata', e.response?.data?.message ?? 'İşlem başarısız.');
            }
            setBlockLoading(false);
          },
        },
      ],
    );
  };

  const handleReport = async () => {
    if (!reportReason.trim()) { Alert.alert('Uyarı', 'Lütfen bir neden girin.'); return; }
    setReportLoading(true);
    try {
      await api.post('/reports', {
        targetType: 'user',
        targetId: username,
        reason: reportReason.trim(),
        details: reportDetails.trim() || undefined,
      });
      setReportVisible(false);
      setReportReason('');
      setReportDetails('');
      Alert.alert('Şikayet Gönderildi', 'Şikayetiniz incelemeye alındı. Teşekkür ederiz.');
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message ?? 'Şikayet gönderilemedi.');
    }
    setReportLoading(false);
  };

  const handleRatingSubmit = async () => {
    if (!ratingStars) { Alert.alert('Puan Gerekli', 'Lütfen bir puan seçin.'); return; }
    if (!me) { (nav as any).navigate('Login'); return; }
    setRatingLoading(true);
    try {
      await api.post(`/reviews/creators/${username}`, { rating: ratingStars, body: ratingText.trim() });
      setRatingStars(0);
      setRatingText('');
      Alert.alert('Teşekkürler!', 'Değerlendirmeniz alındı ve incelemeye gönderildi.');
      refetch();
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message ?? 'Değerlendirme gönderilemedi.');
    }
    setRatingLoading(false);
  };

  const openAdminInbox = async () => {
    if (!adminUserId) { Alert.alert('Hata', 'Kullanıcı ID yüklenemedi.'); return; }
    setInboxVisible(true);
    setInboxLoading(true);
    try {
      const res = await api.get(`/admin/creators/${adminUserId}/inbox`);
      setInboxData(res.data?.conversations ?? []);
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message ?? 'Mesaj kutusu yüklenemedi.');
    }
    setInboxLoading(false);
  };

  const handleAdminStatusChange = (newStatus: string, label: string) => {
    if (!adminUserId) { Alert.alert('Hata', 'Kullanıcı ID yüklenemedi.'); return; }
    Alert.alert(
      label,
      `@${username} için durumu "${label}" olarak ayarlamak istiyor musun?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/admin/creators/${adminUserId}/status`, { status: newStatus });
              Alert.alert('Başarılı', `Durum "${label}" olarak güncellendi.`);
              refetch();
              const r = await api.get(`/admin/profiles/${username}`);
              if (r.data?.id) setAdminUserId(r.data.id);
              setAdminData(r.data ?? null);
            } catch (e: any) {
              Alert.alert('Hata', e.response?.data?.message ?? 'İşlem başarısız.');
            }
          },
        },
      ],
    );
  };

  const handleSubscribe = useCallback(() => {
    const plans = (data as any)?.plans ?? [];
    if (plans.length === 0) {
      Alert.alert('Plan Yok', 'Bu koçun şu an aktif abonelik planı bulunmuyor.');
      return;
    }
    if (plans.length === 1) {
      Alert.alert('Abone Ol', `${plans[0].name} — ₺${plans[0].priceWeb}/ay`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Devam Et', onPress: () => (nav as any).navigate('Pricing') },
      ]);
    } else {
      const opts = plans.map((pl: any) => ({
        text: `${pl.name} — ₺${pl.priceWeb}/ay`,
        onPress: () => (nav as any).navigate('Pricing'),
      }));
      Alert.alert('Plan Seç', 'Abone olmak istediğin planı seç:', [
        ...opts,
        { text: 'İptal', style: 'cancel' },
      ]);
    }
  }, [data, nav]);

  if (isLoading) return <MettloLoadingState />;
  if (isError || !data) return <MettloErrorState onRetry={refetch} />;

  const p = data as any;
  const coverSrc = p.coverUrl ? { uri: p.coverUrl } : require('../../assets/staff-cover.webp');
  const st = p.stats ?? {};

  // Stats (API: p.stats object)
  const ratingAvg = parseFloat(st.ratingAvg ?? p.ratingAvg ?? '0');
  const ratingCount = st.ratingCount ?? p.ratingCount ?? 0;
  const ratingDistribution: Record<string, number> = st.ratingDistribution ?? {};
  const maxRatingCount = Math.max(...Object.values(ratingDistribution).map(Number), 1);
  const liveHours = Math.round(st.liveHours ?? 0);
  const liveSessionCount = st.liveSessions ?? 0;
  const videoCount = st.videoCount ?? 0;
  const videoHours = Math.round(st.videoHours ?? 0);
  const contentTotal = st.contentTotal ?? 0;
  const challengeCount = st.challenges ?? 0;
  const programCount = st.programs ?? 0;
  const subscriberCount = st.subscribers ?? p.subscribersCount ?? 0;
  const followingCount = st.following ?? p.followingCount ?? 0;
  const monthsOnMettlo = st.monthsOnMettlo ?? 0;
  const memberSince = monthsOnMettlo > 0 ? monthsOnMettlo : null;

  // Content arrays (API top-level fields)
  const programs: any[] = p.programs ?? [];
  const upcomingLive: any[] = p.lives ?? [];
  const reviews: any[] = p.reviews ?? [];
  const workplaces: any[] = p.workplaces ?? [];

  // Admin koç profil bilgileri — basic: hızlı /staff, full: ağır endpoint (arka plan)
  const cp = adminBasicData?.creatorProfile ?? adminData?.creatorProfile;
  const adBasic = adminBasicData; // hızlı: role, status, creatorProfile
  const adUser = adminData;       // tam: email, hesap verileri, kişisel bilgiler

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Kapak fotoğrafı ── */}
        <View style={styles.coverWrap}>
          <Image source={coverSrc} style={styles.coverImg} resizeMode="cover" />
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <MettloText style={styles.backText}>‹</MettloText>
          </Pressable>
        </View>

        {/* ── Avatar + Abone Ol ── */}
        <View style={styles.avatarRow}>
          <MettloAvatar
            uri={p.avatarUrl}
            name={p.displayName ?? p.name}
            size={84}
            verified={p.verified}
            tappable
            username={p.username}
            following={following}
            onFollowChange={handleFollowChange}
          />
          <MettloButton label="Abone Ol" size="md" onPress={handleSubscribe} style={styles.subscribeBtn} />
        </View>

        {/* ── Çevrimiçi durum + İsim ── */}
        <View style={styles.info}>
          {onlineStatus !== null && (
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: onlineStatus === 'online' ? Colors.success : Colors.textMuted }]} />
              <MettloText variant="caption" color={onlineStatus === 'online' ? Colors.success : Colors.textMuted}>
                {onlineStatus === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
              </MettloText>
            </View>
          )}

          <MettloText variant="h2" style={styles.displayName}>{p.displayName ?? p.name}</MettloText>
          <MettloText variant="bodySm" color={Colors.textMuted}>@{p.username}</MettloText>
          {p.headline && (
            <MettloText variant="body" color={Colors.textSecondary} style={{ marginTop: 4 }}>
              {p.headline}
            </MettloText>
          )}

          {/* Badge'ler */}
          <View style={styles.badgeRow}>
            {p.credentials && p.credentials.length > 0 &&
              p.credentials.slice(0, 2).map((cr: any) => (
                <View key={cr.id ?? cr.title} style={styles.pill}>
                  <MettloText variant="caption" color={Colors.textMuted}>🎓 {cr.title ?? cr}</MettloText>
                </View>
              ))}
            {memberSince && (
              <View style={styles.pill}>
                <MettloText variant="caption" color={Colors.textMuted}>
                  🏅 METTLO'DA {memberSince < 2 ? '1 AYDAN AZ' : `${memberSince} AY`}
                </MettloText>
              </View>
            )}
          </View>

          {/* Takipçi / Takip */}
          <View style={styles.socialRow}>
            <Pressable onPress={() => setFollowModal('followers')} style={styles.socialBtn}>
              <MettloText variant="h5">{localFollowers !== null ? localFollowers : (p.followersCount ?? 0)}</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}> Takipçi</MettloText>
            </Pressable>
            <Pressable onPress={() => setFollowModal('following')} style={[styles.socialBtn, { marginLeft: 20 }]}>
              <MettloText variant="h5">{followingCount}</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}> Takip</MettloText>
            </Pressable>
          </View>

          {/* Takip Et butonu */}
          {!isSelf && (
            <Pressable
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={toggleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MettloText style={following === true ? [styles.followBtnText, styles.followingBtnText] : styles.followBtnText}>
                  {following === null ? '...' : following ? 'Takipten Çık' : 'Takip Et'}
                </MettloText>
              )}
            </Pressable>
          )}

          {/* Mesaj At / Şikayet / Engelle butonları */}
          {!isSelf && !isStaffRole(p.role) && (
            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtnDark} onPress={handleMessage} disabled={msgLoading}>
                {msgLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MettloText style={styles.actionBtnDarkTxt}>✉ Mesaj At</MettloText>
                )}
              </Pressable>
              <Pressable style={styles.actionBtnOutline} onPress={() => setReportVisible(true)}>
                <MettloText style={styles.actionBtnOutlineTxt}>⚑ Şikayet Et</MettloText>
              </Pressable>
              <Pressable
                style={[styles.actionBtnOutline, isBlocked && styles.actionBtnOutlineActive]}
                onPress={handleBlock}
                disabled={blockLoading}
              >
                {blockLoading ? (
                  <ActivityIndicator color={Colors.error} size="small" />
                ) : (
                  <MettloText style={[styles.actionBtnOutlineTxt, isBlocked ? { color: Colors.error } : {}]}>
                    {isBlocked ? '🚫 Engellendi' : '⊘ Engelle'}
                  </MettloText>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Stats Kartları (2 kolon, web ile aynı sıra) ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>👥</MettloText>
            <MettloText variant="h2">{subscriberCount}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Abone</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>⭐</MettloText>
            <MettloText variant="h2">{ratingCount ? ratingAvg.toFixed(1) : '—'}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>{ratingCount} değerlendirme</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>📡</MettloText>
            <MettloText variant="h2">{`${liveHours} sa`}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Canlı ders ({liveSessionCount})</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>🎬</MettloText>
            <MettloText variant="h2">{videoCount}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Video</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>⏱</MettloText>
            <MettloText variant="h2">{`${videoHours} sa`}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Toplam video süresi</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>📚</MettloText>
            <MettloText variant="h2">{contentTotal}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Eğitim içeriği</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>🗂</MettloText>
            <MettloText variant="h2">{programCount}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Program</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>🏆</MettloText>
            <MettloText variant="h2">{challengeCount}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Challenge</MettloText>
          </View>
        </View>

        {/* ── Hikayeler ── */}
        <View style={styles.section}>
          <ProfileStories username={p.username} isOwn={isSelf} />
        </View>

        {/* ── Hakkımda ── */}
        {p.bio && (
          <View style={styles.section}>
            <MettloText variant="h5">Hakkımda</MettloText>
            <MettloText variant="body" color={Colors.textSecondary}>{p.bio}</MettloText>
          </View>
        )}

        {/* ── Neden Ben? ── */}
        {p.whyChooseMe && (
          <View style={styles.section}>
            <View style={styles.whyCard}>
              <MettloText variant="h5" style={{ marginBottom: Space.s8 }}>Neden Beni Seçmelisiniz?</MettloText>
              <MettloText variant="body" color={Colors.textSecondary}>{p.whyChooseMe}</MettloText>
            </View>
          </View>
        )}

        {/* ── Çalıştığı İşletmeler ── */}
        {workplaces.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Çalıştığı İşletmeler</MettloText>
            {workplaces.map((w: any) => (
              <Pressable
                key={w.slug ?? w.name}
                style={styles.workplaceCard}
                onPress={() => w.slug && (nav as any).navigate('BusinessDetail', { slug: w.slug })}
              >
                {w.logoUrl ? (
                  <Image source={{ uri: w.logoUrl }} style={styles.workplaceLogo} resizeMode="cover" />
                ) : (
                  <View style={[styles.workplaceLogo, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface3 }]}>
                    <MettloText style={{ fontSize: 20 }}>🏢</MettloText>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }}>{w.name}</MettloText>
                  {(w.city || w.district) && (
                    <MettloText variant="caption" color={Colors.textMuted}>
                      📍 {[w.district?.name, w.city?.name].filter(Boolean).join(', ')}
                    </MettloText>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Uzmanlıklar ── */}
        {p.expertise && p.expertise.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Uzmanlık Alanları</MettloText>
            <View style={styles.tags}>
              {p.expertise.map((e: string) => <MettloBadge key={e} label={e} variant="surface" />)}
            </View>
          </View>
        )}

        {/* ── Alt kategoriler ── */}
        {p.subCategories && p.subCategories.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Konular</MettloText>
            <View style={styles.tags}>
              {p.subCategories.slice(0, 6).map((sc: any) => (
                <MettloBadge key={sc.slug} label={sc.name} variant="surface" />
              ))}
            </View>
          </View>
        )}

        {/* ── Programlar ── */}
        {programs.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Programlar</MettloText>
            {programs.map((prog: any) => (
              <Pressable
                key={prog.slug}
                style={styles.programCard}
                onPress={() => (nav as any).navigate('ProgramDetail', { slug: prog.slug })}
              >
                {prog.imageUrl ? (
                  <Image source={{ uri: prog.imageUrl }} style={styles.programImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.programImage, { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' }]}>
                    <MettloText style={{ fontSize: 28 }}>🗂</MettloText>
                  </View>
                )}
                <View style={{ flex: 1, gap: Space.s6 }}>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={2}>
                    {prog.title}
                  </MettloText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s4 }}>
                    {prog.level && (
                      <View style={styles.programTag}>
                        <MettloText style={styles.programTagTxt}>{prog.level}</MettloText>
                      </View>
                    )}
                    {prog.durationWeeks && (
                      <View style={styles.programTag}>
                        <MettloText style={styles.programTagTxt}>{prog.durationWeeks} hafta</MettloText>
                      </View>
                    )}
                  </View>
                  {prog.priceDisplay && (
                    <View style={styles.programPriceBadge}>
                      <MettloText style={styles.programPriceTxt}>{prog.priceDisplay}</MettloText>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Yaklaşan Canlı Dersler ── */}
        {upcomingLive.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Yaklaşan Canlı Dersler</MettloText>
            {upcomingLive.map((ls: any) => {
              const dt = ls.scheduledAt ? new Date(ls.scheduledAt) : null;
              const dtStr = dt
                ? dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <Pressable
                  key={ls.slug}
                  style={styles.liveCard}
                  onPress={() => ls.slug && (nav as any).navigate('LiveDetail', { slug: ls.slug })}
                >
                  <View style={styles.liveBadge}>
                    <MettloText style={styles.liveBadgeTxt}>
                      {ls.status === 'LIVE' ? '🔴 CANLI' : '📅 PLANLANDI'}
                    </MettloText>
                  </View>
                  <MettloText variant="bodySm" style={{ fontWeight: '700', flex: 1 }} numberOfLines={2}>
                    {ls.title}
                  </MettloText>
                  {dtStr ? (
                    <MettloText variant="caption" color={Colors.textMuted}>{dtStr}</MettloText>
                  ) : null}
                  {ls.durationMin ? (
                    <MettloText variant="caption" color={Colors.textMuted}>{ls.durationMin} dakika</MettloText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Ders Takvimi ── */}
        {classes && classes.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Ders Takvimi</MettloText>
            {(classes as any[]).map((c: any) => {
              const dt = c.startsAt ? new Date(c.startsAt) : null;
              const dtStr = dt ? dt.toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
              const typeLabel = c.type === 'ONE_TO_ONE' ? '1:1' : c.type === 'WORKSHOP' ? 'Atölye' : 'Grup dersi';
              const free = Math.max((c.capacity ?? 0) - (c.bookedCount ?? 0), 0);
              return (
                <View key={c.id} style={styles.liveCard}>
                  <View style={styles.liveBadge}>
                    <MettloText style={styles.liveBadgeTxt}>{typeLabel}</MettloText>
                  </View>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={2}>{c.title}</MettloText>
                  {dtStr ? <MettloText variant="caption" color={Colors.textMuted}>📅 {dtStr}</MettloText> : null}
                  <MettloText variant="caption" color={Colors.textMuted}>{free} / {c.capacity ?? '?'} yer boş</MettloText>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Değerlendirmeler ── */}
        <View style={styles.section}>
          <MettloText variant="h5">Değerlendirmeler</MettloText>

          {/* Özet kart */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingLeft}>
              <MettloText style={styles.ratingBigNum}>{ratingAvg.toFixed(1)}</MettloText>
            </View>
            <View style={{ flex: 1, gap: Space.s6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s6 }}>
                <MettloText style={{ color: Colors.warning, fontSize: 14 }}>★</MettloText>
                <MettloText variant="bodySm" style={{ fontWeight: '700', color: Colors.warning }}>
                  {ratingAvg.toFixed(1)}
                </MettloText>
                <MettloText variant="caption" color={Colors.textMuted}>({ratingCount})</MettloText>
              </View>
              <MettloText variant="caption" color={Colors.textMuted}>{ratingCount} değerlendirme</MettloText>
              <View style={{ gap: Space.s4, marginTop: Space.s4 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const cnt = ratingDistribution[String(star)] ?? 0;
                  return <RatingBar key={star} label={String(star)} count={cnt} max={maxRatingCount} />;
                })}
              </View>
            </View>
          </View>

          {/* Mevcut yorumlar */}
          {reviews.length > 0 && reviews.slice(0, 5).map((rv: any) => (
            <View key={rv.id} style={styles.reviewItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s8, marginBottom: Space.s6 }}>
                <MettloAvatar
                  uri={rv.author?.avatarUrl}
                  name={rv.author?.name ?? rv.author?.username ?? '?'}
                  size={32}
                />
                <View style={{ flex: 1 }}>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }}>
                    {rv.author?.name ?? rv.author?.username}
                  </MettloText>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <MettloText key={s} style={{ fontSize: 11, color: s <= rv.rating ? Colors.warning : Colors.surface3 }}>★</MettloText>
                    ))}
                  </View>
                </View>
                <MettloText variant="caption" color={Colors.textMuted}>
                  {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('tr-TR') : ''}
                </MettloText>
              </View>
              {rv.body && <MettloText variant="body" color={Colors.textSecondary}>{rv.body}</MettloText>}
            </View>
          ))}

          {/* Sen de değerlendir */}
          {!isSelf && me && (
            <View style={styles.ratingFormCard}>
              <MettloText variant="h5" style={{ marginBottom: Space.s12 }}>Sen de değerlendir</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>Puanın</MettloText>
              <StarPicker value={ratingStars} onChange={setRatingStars} />
              <MettloText variant="bodySm" color={Colors.textMuted} style={{ marginTop: Space.s12, marginBottom: Space.s8 }}>Yorumun</MettloText>
              <TextInput
                style={styles.ratingInput}
                multiline
                numberOfLines={4}
                placeholder="Koç, programlar ve derslerle ilgili deneyimini paylaş..."
                placeholderTextColor={Colors.textMuted}
                value={ratingText}
                onChangeText={setRatingText}
              />
              <MettloText variant="caption" color={Colors.textMuted} style={{ marginTop: Space.s6 }}>
                Sosyal medya hesabı, bağlantı veya iletişim bilgisi paylaşılamaz.
              </MettloText>
              <Pressable style={styles.ratingSubmitBtn} onPress={handleRatingSubmit} disabled={ratingLoading}>
                {ratingLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MettloText style={styles.ratingSubmitTxt}>Değerlendirmeyi Gönder</MettloText>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* ── SÜPER ADMIN GÖRÜNÜMÜ ── */}
        {amSuperAdmin && (
          <View style={styles.section}>
            <View style={styles.adminSectionCard}>
              {/* Başlık */}
              <View style={styles.adminBadgeRow}>
                <MettloText style={styles.adminBadgeIcon}>🛡</MettloText>
                <MettloText style={styles.adminBadgeTxt}>SÜPER ADMIN GÖRÜNÜMÜ</MettloText>
              </View>

              {/* Hızlı butonlar */}
              <View style={{ gap: Space.s8, marginBottom: Space.s16 }}>
                <Pressable style={styles.inboxBtn} onPress={openAdminInbox}>
                  <MettloText style={{ fontSize: 14 }}>✉</MettloText>
                  <MettloText style={styles.inboxBtnTxt}>Koç Mesaj Kutusu</MettloText>
                </Pressable>
                <Pressable
                  style={styles.healthBtn}
                  onPress={() => adminUserId ? (nav as any).navigate('AdminUserDetail', { userId: adminUserId }) : Alert.alert('Hata', 'Kullanıcı ID yüklenemedi.')}
                >
                  <MettloText style={{ fontSize: 14 }}>❤</MettloText>
                  <MettloText style={styles.healthBtnTxt}>Sağlık Verileri</MettloText>
                </Pressable>
              </View>

              {/* Kişisel Bilgiler — adBasic anında, adUser arka planda gelir */}
              <Accordion title="Kişisel Bilgiler">
                {adminLoadError
                  ? <MettloText variant="caption" color={Colors.error}>{adminLoadError}</MettloText>
                  : (adBasic || adUser)
                    ? <View style={{ gap: Space.s8 }}>
                        <AdminRow label="Kullanıcı adı" value={`@${(adBasic ?? adUser)?.username ?? '—'}`} />
                        <AdminRow label="Rol" value={(adBasic ?? adUser)?.role ?? '—'} />
                        <AdminRow label="Durum" value={(adBasic ?? adUser)?.status ?? '—'} />
                        {adUser
                          ? <>
                              <AdminRow label="E-posta" value={adUser.email ?? '—'} />
                              <AdminRow label="Kayıt tarihi" value={adUser.createdAt ? new Date(adUser.createdAt).toLocaleDateString('tr-TR') : '—'} />
                              <AdminRow label="Doğum tarihi" value={adUser.birthDate ? new Date(adUser.birthDate).toLocaleDateString('tr-TR') : '—'} />
                              {adUser.personal?.fullName && <AdminRow label="Ad Soyad" value={adUser.personal.fullName} />}
                              {adUser.personal?.phone && <AdminRow label="Telefon" value={adUser.personal.phone} />}
                              {adUser.personal?.gender && <AdminRow label="Cinsiyet" value={adUser.personal.gender} />}
                            </>
                          : <MettloText variant="caption" color={Colors.textMuted} style={{ marginTop: Space.s4 }}>
                              Tam bilgiler yükleniyor…
                            </MettloText>
                        }
                      </View>
                    : <ActivityIndicator color={Colors.primary} size="small" />
                }
              </Accordion>

              {/* Koç Profili */}
              {cp && (
                <View style={styles.coachProfileSection}>
                  <MettloText variant="h5" style={{ marginBottom: Space.s12 }}>Koç Profili</MettloText>
                  <AdminRow label="Görünen ad" value={cp.displayName ?? '—'} />
                  <View style={{ flexDirection: 'row', gap: Space.s6, marginTop: Space.s8 }}>
                    <View style={styles.statusChip}>
                      <MettloText style={styles.statusChipTxt}>{(adBasic ?? adUser)?.status ?? 'ACTIVE'}</MettloText>
                    </View>
                    {cp.status === 'ACTIVE' && cp.isPublic !== false && (
                      <View style={[styles.statusChip, styles.statusChipGreen]}>
                        <MettloText style={[styles.statusChipTxt, { color: Colors.success }]}>YAYINDA</MettloText>
                      </View>
                    )}
                  </View>
                  {adUser && (
                    <View style={{ marginTop: Space.s12, gap: Space.s6 }}>
                      <AdminRow label="Beyan / kullanılan davet"
                        value={`${adUser.creatorProfile?.inviteQuotaDeclared ?? 0} / ${adUser.creatorProfile?.inviteQuotaUsed ?? 0}`} />
                      <AdminRow label="Abone / takipçi / puan"
                        value={`${adUser.creatorProfile?.subscribersCount ?? 0} · ${adUser.creatorProfile?.followersCount ?? 0} · ${parseFloat(adUser.creatorProfile?.ratingAvg ?? '0').toFixed(1)} (${adUser.creatorProfile?.ratingCount ?? 0})`} />
                    </View>
                  )}
                </View>
              )}

              {/* Temel admin verisi yüklenene kadar spinner */}
              {!adBasic && !adminLoadError && (
                <View style={{ alignItems: 'center', paddingVertical: Space.s16 }}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <MettloText variant="caption" color={Colors.textMuted} style={{ marginTop: Space.s8 }}>Veriler yükleniyor…</MettloText>
                </View>
              )}
              {!adBasic && adminLoadError && (
                <MettloText variant="caption" color={Colors.error} style={{ textAlign: 'center', marginVertical: Space.s8 }}>{adminLoadError}</MettloText>
              )}
              {adBasic && (
                <>
                  <MettloText variant="h5" style={{ marginBottom: Space.s8, marginTop: Space.s8 }}>Hesap Verileri</MettloText>
                  {!adUser && (
                    <MettloText variant="caption" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>
                      Hesap detayları arka planda yükleniyor…
                    </MettloText>
                  )}
                  <Accordion title="Abonelikler" count={adUser.subscriptions?.length ?? 0}>
                    {(adUser.subscriptions?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Abonelik yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.subscriptions.map((s: any) => (
                          <AdminRow key={s.id ?? s.planId} label={s.plan?.name ?? s.planId ?? 'Plan'} value={`${s.status ?? '—'} · ${s.renewsAt ? new Date(s.renewsAt).toLocaleDateString('tr-TR') : s.createdAt ? new Date(s.createdAt).toLocaleDateString('tr-TR') : '—'}`} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Erişim hakları (entitlement)" count={adUser.entitlements?.length ?? 0}>
                    {(adUser.entitlements?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Erişim hakkı yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.entitlements.map((e: any) => (
                          <AdminRow key={e.id ?? e.feature} label={e.feature ?? e.type ?? 'Özellik'} value={`${e.status ?? 'aktif'}`} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Ödemeler" count={adUser.payments?.length ?? 0}>
                    {(adUser.payments?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Ödeme yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.payments.slice(0, 10).map((pay: any) => (
                          <AdminRow key={pay.id} label={`₺${(pay.amount ?? 0) / 100} · ${pay.status ?? '—'}`} value={pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Siparişler" count={adUser.orders?.length ?? 0}>
                    {(adUser.orders?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Sipariş yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.orders.slice(0, 10).map((o: any) => (
                          <AdminRow key={o.id} label={o.productName ?? o.type ?? 'Sipariş'} value={`${o.status ?? '—'} · ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : '—'}`} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Faturalar" count={adUser.invoices?.length ?? 0}>
                    {(adUser.invoices?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Fatura yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.invoices.slice(0, 10).map((inv: any) => (
                          <AdminRow key={inv.id} label={`₺${(inv.total ?? inv.amount ?? 0) / 100}`} value={`${inv.status ?? '—'} · ${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('tr-TR') : '—'}`} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Antrenman kayıtları" count={adUser.workouts?.length ?? 0}>
                    {(adUser.workouts?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Antrenman kaydı yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.workouts.slice(0, 10).map((w: any) => (
                          <AdminRow key={w.id} label={w.title ?? w.workoutTitle ?? 'Antrenman'} value={w.completedAt ? new Date(w.completedAt).toLocaleDateString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Koçluk ilişkileri" count={(adUser.coachingAsMember?.length ?? 0) + (adUser.coachingAsCoach?.length ?? 0)}>
                    <View style={{ gap: Space.s8 }}>
                      {(adUser.coachingAsMember?.length ?? 0) > 0 && adUser.coachingAsMember.map((r: any) => (
                        <AdminRow key={r.id} label={`Üye olarak — @${r.coach?.username ?? '?'}`} value={r.status ?? '—'} />
                      ))}
                      {(adUser.coachingAsCoach?.length ?? 0) > 0 && adUser.coachingAsCoach.map((r: any) => (
                        <AdminRow key={r.id} label={`Koç olarak — @${r.member?.username ?? '?'}`} value={r.status ?? '—'} />
                      ))}
                      {(adUser.coachingAsMember?.length ?? 0) === 0 && (adUser.coachingAsCoach?.length ?? 0) === 0 && (
                        <MettloText variant="caption" color={Colors.textMuted}>Koçluk ilişkisi yok.</MettloText>
                      )}
                    </View>
                  </Accordion>
                  <Accordion title="Check-in'ler" count={adUser.checkins?.length ?? 0}>
                    {(adUser.checkins?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Check-in yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.checkins.slice(0, 10).map((c: any) => (
                          <AdminRow key={c.id} label={c.business?.name ?? c.businessId ?? 'İşletme'} value={c.checkedAt ? new Date(c.checkedAt).toLocaleString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Yorumlar" count={adUser.reviews?.length ?? 0}>
                    {(adUser.reviews?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Yorum yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.reviews.slice(0, 10).map((rv: any) => (
                          <AdminRow key={rv.id} label={`${'★'.repeat(rv.rating ?? 0)} @${rv.target?.username ?? '?'}`} value={rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Konuşmalar (üst veri)" count={adUser.conversations?.length ?? 0}>
                    {(adUser.conversations?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Konuşma yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.conversations.slice(0, 10).map((cv: any) => (
                          <AdminRow key={cv.id} label={cv.with?.map((u: any) => `@${u.username}`).join(', ') ?? cv.id.slice(0, 8)} value={`${cv.messageCount ?? 0} mesaj · ${cv.updatedAt ? new Date(cv.updatedAt).toLocaleDateString('tr-TR') : '—'}`} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Sağlık paylaşım rızaları" count={adUser.healthConsents?.length ?? 0}>
                    {(adUser.healthConsents?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Sağlık rızası yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.healthConsents.map((h: any) => (
                          <AdminRow key={h.id} label={h.coach?.username ? `@${h.coach.username}` : 'Koç'} value={`${h.status ?? 'verilmiş'} · ${h.grantedAt ? new Date(h.grantedAt).toLocaleDateString('tr-TR') : '—'}`} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Yaptırımlar" count={adUser.sanctions?.length ?? 0}>
                    {(adUser.sanctions?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Yaptırım yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.sanctions.map((s: any) => (
                          <AdminRow key={s.id} label={`${s.type ?? '—'} · ${s.reason ?? '—'}`} value={s.createdAt ? new Date(s.createdAt).toLocaleDateString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Cihazlar ve oturumlar" count={adUser.devices?.length ?? 0}>
                    {(adUser.devices?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Cihaz kaydı yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.devices.map((d: any) => (
                          <AdminRow key={d.id} label={d.deviceName ?? d.model ?? d.platform ?? 'Cihaz'} value={d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleDateString('tr-TR') : d.createdAt ? new Date(d.createdAt).toLocaleDateString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                  <Accordion title="Engellenen Kullanıcılar" count={adUser.blocks?.length ?? 0}>
                    {(adUser.blocks?.length ?? 0) === 0
                      ? <MettloText variant="caption" color={Colors.textMuted}>Engellenen yok.</MettloText>
                      : <View style={{ gap: Space.s8 }}>{adUser.blocks.map((b: any) => (
                          <AdminRow key={b.id} label={`@${b.blocked?.username ?? b.blockedId ?? '?'}`} value={b.createdAt ? new Date(b.createdAt).toLocaleDateString('tr-TR') : '—'} />
                        ))}</View>
                    }
                  </Accordion>
                </>
              )}
            </View>
          </View>
        )}

        {/* ── SÜPER ADMIN / ADMIN Görünümü ── */}
        {amAdminPlus && (
          <View style={styles.section}>
            <View style={[styles.adminSectionCard, styles.adminActionCard]}>
              <View style={styles.adminBadgeRow}>
                <MettloText style={[styles.adminBadgeIcon, { color: Colors.accent }]}>👥</MettloText>
                <MettloText style={[styles.adminBadgeTxt, { color: Colors.accent }]}>
                  {amSuperAdmin ? 'SÜPER ADMIN / ADMIN GÖRÜNÜMÜ' : 'ADMIN GÖRÜNÜMÜ'}
                </MettloText>
              </View>

              {/* Durum chip'leri */}
              {(adBasic || adUser) && (
                <View style={{ flexDirection: 'row', gap: Space.s6, marginBottom: Space.s12 }}>
                  <View style={styles.statusChipGray}><MettloText style={styles.statusChipGrayTxt}>KOÇ</MettloText></View>
                  <View style={styles.statusChipGreen}><MettloText style={[styles.statusChipTxt, { color: Colors.success, fontWeight: '700' }]}>{(adBasic ?? adUser)?.status ?? '—'}</MettloText></View>
                  {cp?.status && (
                    <View style={styles.statusChipGreen}>
                      <MettloText style={[styles.statusChipTxt, { color: Colors.success, fontWeight: '700' }]}>{cp.status}</MettloText>
                    </View>
                  )}
                </View>
              )}

              {/* Koç başvurusu kartı - /staff endpoint'ten anında gelir */}
              {cp?.approvedBy && (
                <View style={styles.coachApplicationCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s8, marginBottom: Space.s8 }}>
                    <MettloText style={{ color: Colors.textSecondary }}>🛡</MettloText>
                    <MettloText variant="bodySm" style={{ fontWeight: '700' }}>Koç başvurusu</MettloText>
                  </View>
                  <MettloText variant="caption" color={Colors.textSecondary}>
                    <MettloText style={{ fontWeight: '700' }}>@{cp.approvedBy.username}</MettloText>
                    {` (${cp.approvedBy.role?.toLowerCase() ?? 'admin'}) tarafından başvurusu onaylandı · `}
                    {cp.approvedAt ? new Date(cp.approvedAt).toLocaleString('tr-TR') : ''}
                  </MettloText>
                  <Pressable
                    style={styles.republishBtn}
                    onPress={() => handleAdminStatusChange('ACTIVE', 'Yeniden yayınla')}
                  >
                    <MettloText style={styles.republishBtnTxt}>Yeniden yayınla</MettloText>
                  </Pressable>
                </View>
              )}

              {/* Admin aksiyonlar */}
              <AdminAccordionAction title="Profili düzenle">
                <Pressable
                  style={styles.adminActionBtn}
                  onPress={() => adminUserId ? (nav as any).navigate('AdminUserDetail', { userId: adminUserId }) : Alert.alert('Hata', 'Kullanıcı ID yüklenemedi.')}
                >
                  <MettloText style={styles.adminActionBtnTxt}>Admin Panelinde Düzenle →</MettloText>
                </Pressable>
              </AdminAccordionAction>

              <AdminAccordionAction title="Süreli askıya al">
                <MettloText variant="caption" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>
                  Koçu belirli bir süre askıya al.
                </MettloText>
                <Pressable
                  style={[styles.adminActionBtn, { borderColor: Colors.warning }]}
                  onPress={() => handleAdminStatusChange('SUSPENDED', 'Süreli askıya al')}
                >
                  <MettloText style={[styles.adminActionBtnTxt, { color: Colors.warning }]}>Askıya Al</MettloText>
                </Pressable>
              </AdminAccordionAction>

              <AdminAccordionAction title="Uyarı ver">
                <MettloText variant="caption" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>
                  Koça resmi uyarı gönder.
                </MettloText>
                <Pressable
                  style={[styles.adminActionBtn, { borderColor: Colors.warning }]}
                  onPress={() => adminUserId ? (nav as any).navigate('AdminUserDetail', { userId: adminUserId }) : Alert.alert('Hata', 'Kullanıcı ID yüklenemedi.')}
                >
                  <MettloText style={[styles.adminActionBtnTxt, { color: Colors.warning }]}>Uyarı Gönder</MettloText>
                </Pressable>
              </AdminAccordionAction>

              {amSuperAdmin && (
                <>
                  <AdminAccordionAction title="Kalıcı yasakla (ban)">
                    <MettloText variant="caption" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>
                      Koçu platformdan kalıcı olarak yasakla.
                    </MettloText>
                    <Pressable
                      style={[styles.adminActionBtn, { borderColor: Colors.error }]}
                      onPress={() => handleAdminStatusChange('BANNED', 'Kalıcı yasakla')}
                    >
                      <MettloText style={[styles.adminActionBtnTxt, { color: Colors.error }]}>Kalıcı Yasakla</MettloText>
                    </Pressable>
                  </AdminAccordionAction>

                  <AdminAccordionAction title="Hesabı sil">
                    <MettloText variant="caption" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>
                      Bu işlem geri alınamaz. Hesap kalıcı olarak silinir.
                    </MettloText>
                    <Pressable
                      style={[styles.adminActionBtn, { borderColor: Colors.error }]}
                      onPress={() =>
                        Alert.alert(
                          'Hesabı Sil',
                          'Bu işlem geri alınamaz. Emin misin?',
                          [
                            { text: 'İptal', style: 'cancel' },
                            {
                              text: 'Sil',
                              style: 'destructive',
                              onPress: () => Alert.alert('İşlem Gerekli', 'Hesap silme için masaüstü admin panelini kullanın.'),
                            },
                          ],
                        )
                      }
                    >
                      <MettloText style={[styles.adminActionBtnTxt, { color: Colors.error }]}>Hesabı Sil</MettloText>
                    </Pressable>
                  </AdminAccordionAction>
                </>
              )}

              <Pressable
                style={{ marginTop: Space.s12 }}
                onPress={() => (nav as any).navigate('AdminAudit')}
              >
                <MettloText variant="caption" color={Colors.textMuted}>
                  Tam kayıt geçmişi için{' '}
                  <MettloText style={{ color: Colors.primary }}>Denetim Kayıtları</MettloText>
                  {amSuperAdmin ? ' (süper admin tümünü, admin ekip loglarını görür).' : '.'}
                </MettloText>
              </Pressable>
            </View>
          </View>
        )}

        <MettloCopyright />
      </ScrollView>

      {/* ── Sticky Abone Ol bar ── */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyLeft}>
          <MettloAvatar uri={p.avatarUrl} name={p.displayName ?? p.name} size={32} verified={p.verified} />
          <View style={{ marginLeft: 10 }}>
            <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={1}>
              {p.displayName ?? p.name}
            </MettloText>
          </View>
        </View>
        <MettloButton label="Abone Ol" size="md" onPress={handleSubscribe} style={styles.stickyBtn} />
      </View>

      {/* ── Takipçi / Takip Modal ── */}
      <FollowListModal
        visible={followModal !== null}
        mode={followModal ?? 'followers'}
        username={p.username}
        onClose={() => setFollowModal(null)}
        onNavigate={(u) => (nav as any).navigate('CoachDetail', { username: u })}
      />

      {/* ── Şikayet Et Modal ── */}
      <Modal visible={reportVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setReportVisible(false)}>
        <View style={modal.container}>
          <Pressable style={modal.backdrop} onPress={() => setReportVisible(false)} />
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <MettloText variant="h5" style={{ marginBottom: Space.s16 }}>Şikayet Et</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted} style={{ marginBottom: Space.s8 }}>Neden</MettloText>
            <TextInput
              style={[modal.input, { height: 44 }]}
              placeholder="Uygunsuz davranış, spam, vb."
              placeholderTextColor={Colors.textMuted}
              value={reportReason}
              onChangeText={setReportReason}
            />
            <MettloText variant="bodySm" color={Colors.textMuted} style={{ marginTop: Space.s12, marginBottom: Space.s8 }}>Detay (isteğe bağlı)</MettloText>
            <TextInput
              style={[modal.input, { height: 88 }]}
              multiline
              placeholder="Ek bilgi..."
              placeholderTextColor={Colors.textMuted}
              value={reportDetails}
              onChangeText={setReportDetails}
            />
            <Pressable style={modal.submitBtn} onPress={handleReport} disabled={reportLoading}>
              {reportLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MettloText style={modal.submitTxt}>Şikayet Gönder</MettloText>
              )}
            </Pressable>
            <Pressable onPress={() => setReportVisible(false)} style={{ marginTop: Space.s12, alignItems: 'center' }}>
              <MettloText color={Colors.textMuted}>İptal</MettloText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Admin Koç Mesaj Kutusu Modal ── */}
      <Modal visible={inboxVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setInboxVisible(false)}>
        <View style={modal.container}>
          <Pressable style={modal.backdrop} onPress={() => setInboxVisible(false)} />
          <View style={[modal.sheet, { maxHeight: '85%' }]}>
            <View style={modal.handle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.s16 }}>
              <MettloText variant="h5">Koç Mesaj Kutusu</MettloText>
              <Pressable onPress={() => setInboxVisible(false)}>
                <MettloText color={Colors.textMuted}>✕</MettloText>
              </Pressable>
            </View>
            <View style={inbox.notice}>
              <MettloText variant="caption" color={Colors.textMuted}>
                Salt okunur görünüm · her açılış denetim kaydına yazılır
              </MettloText>
            </View>
            {inboxLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Space.s32 }} />
            ) : inboxData.length === 0 ? (
              <MettloText color={Colors.textMuted} style={{ textAlign: 'center', marginTop: Space.s32 }}>
                Konuşma bulunamadı.
              </MettloText>
            ) : (
              <FlatList
                data={inboxData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={inbox.row}
                    onPress={() =>
                      (nav as any).navigate('Conversation', {
                        conversationId: item.id,
                        otherName: item.with?.[0]?.name ?? item.with?.[0]?.username ?? 'Kullanıcı',
                        otherUsername: item.with?.[0]?.username,
                      })
                    }
                  >
                    <View style={{ flex: 1, gap: Space.s4 }}>
                      <MettloText variant="bodySm" style={{ fontWeight: '700' }}>
                        {item.with?.map((u: any) => `@${u.username}`).join(' ↔ ') ?? `Konuşma ${item.id.slice(0, 8)}`}
                      </MettloText>
                      {item.lastMessage && (
                        <MettloText variant="caption" color={Colors.textMuted} numberOfLines={1}>
                          {item.lastMessage.body}
                        </MettloText>
                      )}
                    </View>
                    <MettloText variant="caption" color={Colors.textMuted}>
                      {item.messageCount ?? 0} mesaj
                    </MettloText>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.borderSubtle }} />}
                contentContainerStyle={{ paddingBottom: Space.s32 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Yardımcı bileşen ─────────────────────────────────────────────────────────

function AdminRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: Space.s2 }}>
      <MettloText variant="caption" color={Colors.textMuted}>{label}</MettloText>
      <MettloText variant="bodySm">{value}</MettloText>
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },

  coverWrap: { width: SW, height: COVER_H, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute', top: 48, left: 16,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 22, color: '#fff', lineHeight: 26 },

  avatarRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: Space.s16, marginTop: -42,
  },
  subscribeBtn: { marginBottom: 4 },

  info: { paddingHorizontal: Space.s16, paddingTop: Space.s12, gap: Space.s6 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  displayName: { fontWeight: '800' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8, marginTop: Space.s8 },
  pill: {
    backgroundColor: Colors.surface2, borderRadius: Radius.pill,
    paddingHorizontal: Space.s12, paddingVertical: Space.s4,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  socialRow: { flexDirection: 'row', marginTop: Space.s8 },
  socialBtn: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  followBtn: {
    marginTop: Space.s12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  followBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  followingBtnText: { color: Colors.textSecondary },

  actionRow: { flexDirection: 'row', gap: Space.s8, marginTop: Space.s12, flexWrap: 'wrap' },
  actionBtnDark: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.s6,
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    paddingVertical: Space.s10, paddingHorizontal: Space.s12,
    borderWidth: 1, borderColor: Colors.borderSubtle, minWidth: 90,
  },
  actionBtnDarkTxt: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.s6,
    backgroundColor: 'transparent', borderRadius: Radius.md,
    paddingVertical: Space.s10, paddingHorizontal: Space.s12,
    borderWidth: 1, borderColor: Colors.borderSubtle, minWidth: 90,
  },
  actionBtnOutlineActive: { borderColor: Colors.error },
  actionBtnOutlineTxt: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Space.s12,
    paddingHorizontal: Space.s16, marginTop: Space.s20,
  },
  statCard: {
    width: (SW - Space.s16 * 2 - Space.s12) / 2,
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    padding: Space.s16, gap: Space.s4,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  statIcon: { fontSize: 20 },

  section: { paddingHorizontal: Space.s16, paddingTop: Space.s20, gap: Space.s10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8 },
  whyCard: {
    backgroundColor: 'rgba(249,115,22,0.07)', borderRadius: Radius.card,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.20)',
    padding: Space.s16,
  },
  workplaceCard: {
    flexDirection: 'row', alignItems: 'center', gap: Space.s12,
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s12,
  },
  workplaceLogo: { width: 44, height: 44, borderRadius: Radius.md, overflow: 'hidden' },

  programCard: {
    flexDirection: 'row', gap: Space.s12,
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s12,
  },
  programImage: { width: 80, height: 80, borderRadius: Radius.md, overflow: 'hidden' },
  programTag: {
    backgroundColor: Colors.surface3, borderRadius: Radius.pill,
    paddingHorizontal: Space.s8, paddingVertical: 2,
  },
  programTagTxt: { fontSize: 11, color: Colors.textMuted },
  programPriceBadge: {
    backgroundColor: 'rgba(249,115,22,0.12)', borderRadius: Radius.pill,
    paddingHorizontal: Space.s10, paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  programPriceTxt: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  liveCard: {
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s12, gap: Space.s6,
  },
  liveBadge: {
    backgroundColor: Colors.surface3, borderRadius: Radius.pill,
    paddingHorizontal: Space.s8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  liveBadgeTxt: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  ratingCard: {
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16,
    flexDirection: 'row', gap: Space.s16, alignItems: 'flex-start',
  },
  ratingLeft: { alignItems: 'center', justifyContent: 'center', width: 72 },
  ratingBigNum: { fontSize: 56, fontWeight: '800', color: Colors.primary, lineHeight: 64 },
  reviewItem: {
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s12,
  },
  ratingFormCard: {
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s16,
  },
  ratingInput: {
    backgroundColor: Colors.surface3, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    color: Colors.textPrimary, fontSize: 14, padding: Space.s12,
    textAlignVertical: 'top',
  },
  ratingSubmitBtn: {
    marginTop: Space.s12, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: Space.s12, alignItems: 'center',
  },
  ratingSubmitTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Admin sections
  adminSectionCard: {
    backgroundColor: Colors.surface2, borderRadius: Radius.card,
    borderWidth: 1, borderColor: 'rgba(236,72,153,0.25)', padding: Space.s16, gap: Space.s8,
  },
  adminActionCard: {
    borderColor: 'rgba(236,72,153,0.20)',
  },
  adminBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s8, marginBottom: Space.s12 },
  adminBadgeIcon: { fontSize: 14, color: Colors.accent },
  adminBadgeTxt: { fontSize: 12, fontWeight: '800', color: Colors.accent, letterSpacing: 1 },

  inboxBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.s8,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Space.s12,
  },
  inboxBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  healthBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.s8,
    backgroundColor: 'transparent', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    paddingVertical: Space.s12,
  },
  healthBtnTxt: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },

  coachProfileSection: {
    borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    marginTop: Space.s8, paddingTop: Space.s12,
  },
  statusChip: {
    paddingHorizontal: Space.s10, paddingVertical: Space.s4,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surface3,
  },
  statusChipTxt: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  statusChipGreen: {
    paddingHorizontal: Space.s10, paddingVertical: Space.s4,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(52,211,153,0.30)',
    backgroundColor: 'rgba(52,211,153,0.10)',
  },
  statusChipGray: {
    paddingHorizontal: Space.s10, paddingVertical: Space.s4,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surface3,
  },
  statusChipGrayTxt: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },

  coachApplicationCard: {
    backgroundColor: Colors.surface3, borderRadius: Radius.md,
    padding: Space.s12, marginBottom: Space.s8,
  },
  republishBtn: {
    marginTop: Space.s10, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: Space.s10, alignItems: 'center',
  },
  republishBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  adminActionBtn: {
    borderRadius: Radius.md, paddingVertical: Space.s10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  adminActionBtnTxt: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space.s16, paddingVertical: Space.s12,
    backgroundColor: Colors.surface1, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
  },
  stickyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Space.s12 },
  stickyBtn: { minWidth: 120 },
});

const acc = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface3, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Space.s12,
  },
  badge: {
    backgroundColor: Colors.surface2, borderRadius: Radius.pill,
    paddingHorizontal: Space.s8, paddingVertical: 2,
  },
  badgeTxt: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  content: {
    padding: Space.s12, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
  },
});

const modal = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: Colors.surface1, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingTop: Space.s8, paddingHorizontal: Space.s16, paddingBottom: Space.s32,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderSubtle, alignSelf: 'center', marginBottom: Space.s16,
  },
  input: {
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    color: Colors.textPrimary, fontSize: 14, padding: Space.s12,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: Space.s16, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: Space.s12, alignItems: 'center',
  },
  submitTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const inbox = StyleSheet.create({
  notice: {
    backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: Radius.md,
    padding: Space.s10, marginBottom: Space.s12,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.20)',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Space.s12,
    paddingVertical: Space.s12,
  },
});
