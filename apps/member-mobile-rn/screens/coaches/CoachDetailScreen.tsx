import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloErrorState } from '../../components/ui/MettloErrorState';
import { MettloCopyright } from '../../components/ui/MettloCopyright';
import { ProfileStories } from '../../components/ui/ProfileStories';
import { Colors, Radius, Space } from '../../constants/tokens';
import { coachService } from '../../services/coachService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'CoachDetail'>;
const { width: SW } = Dimensions.get('window');
const COVER_H = 220;

export function CoachDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { username } = route.params;
  const me = useAuthStore((s) => s.user);
  const isSelf = !!me && me.username === username;

  const [following, setFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (isSelf) return;
    userService.getFollowStatus(username)
      .then((d) => setFollowing(d?.isFollowing ?? d?.following ?? false))
      .catch(() => setFollowing(false));
  }, [username, isSelf]);

  const toggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await userService.unfollow(username);
        setFollowing(false);
      } else {
        await userService.follow(username);
        setFollowing(true);
      }
    } catch {}
    setFollowLoading(false);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coach-profile', username],
    queryFn: () => coachService.getProfile(username),
  });

  const handleSubscribe = useCallback(() => {
    const plans = (data as any)?.plans ?? [];
    if (plans.length === 0) { Alert.alert('Plan Yok', 'Bu koçun şu an aktif abonelik planı bulunmuyor.'); return; }
    if (plans.length === 1) {
      Alert.alert('Abone Ol', `${plans[0].name} — ₺${plans[0].priceWeb}/ay`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Devam Et', onPress: () => (nav as any).navigate('Pricing') },
      ]);
    } else {
      const opts = plans.map((pl: any) => ({ text: `${pl.name} — ₺${pl.priceWeb}/ay`, onPress: () => (nav as any).navigate('Pricing') }));
      Alert.alert('Plan Seç', 'Abone olmak istediğin planı seç:', [...opts, { text: 'İptal', style: 'cancel' }]);
    }
  }, [data, nav]);

  if (isLoading) return <MettloLoadingState />;
  if (isError || !data) return <MettloErrorState onRetry={refetch} />;

  const p = data;
  const coverSrc = p.coverUrl
    ? { uri: p.coverUrl }
    : require('../../assets/staff-cover.webp');

  const memberSince = p.updatedAt
    ? Math.max(1, Math.round((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : null;

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
          <MettloAvatar uri={p.avatarUrl} name={p.displayName ?? p.name} size={84} verified={p.verified} tappable username={p.username} />
          <MettloButton label="Abone Ol" size="md" onPress={handleSubscribe} style={styles.subscribeBtn} />
        </View>

        {/* ── İsim + kullanıcı adı + bio ── */}
        <View style={styles.info}>
          <MettloText variant="h2" style={styles.displayName}>{p.displayName ?? p.name}</MettloText>
          <MettloText variant="bodySm" color={Colors.textMuted}>@{p.username}</MettloText>
          {p.headline && <MettloText variant="body" color={Colors.textSecondary} style={{ marginTop: 4 }}>{p.headline}</MettloText>}

          {/* Badge'ler */}
          <View style={styles.badgeRow}>
            {p.credentials && p.credentials.length > 0 && p.credentials.slice(0, 2).map((cr: any) => (
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
            <MettloText variant="body">
              <MettloText variant="h5">{p.followersCount ?? 0}</MettloText>
              <MettloText variant="body" color={Colors.textMuted}> Takipçi</MettloText>
            </MettloText>
            <MettloText variant="body" style={{ marginLeft: 20 }}>
              <MettloText variant="h5">{p.followingCount ?? 0}</MettloText>
              <MettloText variant="body" color={Colors.textMuted}> Takip</MettloText>
            </MettloText>
          </View>

          {/* Takip Et butonu */}
          {!isSelf && (
            <Pressable
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={toggleFollow}
              disabled={followLoading}
            >
              {followLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <MettloText style={following === true ? [styles.followBtnText, styles.followingBtnText] : styles.followBtnText}>
                    {following === null ? '...' : following ? 'Takipten Çık' : 'Takip Et'}
                  </MettloText>
              }
            </Pressable>
          )}
        </View>

        {/* ── Stats kartları (web'deki 2-col grid) ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>👥</MettloText>
            <MettloText variant="h2">{p.subscribersCount ?? 0}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>Abone</MettloText>
          </View>
          <View style={styles.statCard}>
            <MettloText style={styles.statIcon}>☆</MettloText>
            <MettloText variant="h2">{parseFloat(p.ratingAvg ?? '0').toFixed(1)}</MettloText>
            <MettloText variant="bodySm" color={Colors.textMuted}>{p.ratingCount ?? 0} değerlendirme</MettloText>
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

        {/* ── Neden Ben? (kart stilinde) ── */}
        {p.whyChooseMe && (
          <View style={styles.section}>
            <View style={styles.whyCard}>
              <MettloText variant="h5" style={{ marginBottom: Space.s8 }}>Neden Beni Seçmelisiniz?</MettloText>
              <MettloText variant="body" color={Colors.textSecondary}>{p.whyChooseMe}</MettloText>
            </View>
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

        {/* ── Çalışma Yerleri ── */}
        {p.coachWorkplaces && p.coachWorkplaces.length > 0 && (
          <View style={styles.section}>
            <MettloText variant="h5">Çalıştığı İşletmeler</MettloText>
            {p.coachWorkplaces.map((w: any) => {
              const b = w.business ?? w;
              return (
                <View key={b.slug ?? b.name} style={styles.workplaceCard}>
                  <View style={styles.workplaceLogo}>
                    <MettloText style={{ fontSize: 20 }}>🏢</MettloText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <MettloText variant="bodySm" style={{ fontWeight: '700' }}>{b.name}</MettloText>
                    {b.city && <MettloText variant="caption" color={Colors.textMuted}>📍 {b.city.name ?? b.city}</MettloText>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <MettloCopyright />
      </ScrollView>

      {/* ── Sticky Abone Ol bar (web'deki gibi) ── */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyLeft}>
          <MettloAvatar uri={p.avatarUrl} name={p.displayName ?? p.name} size={32} verified={p.verified} />
          <View style={{ marginLeft: 10 }}>
            <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={1}>{p.displayName ?? p.name}</MettloText>
          </View>
        </View>
        <MettloButton label="Abone Ol" size="md" onPress={handleSubscribe} style={styles.stickyBtn} />
      </View>
    </SafeAreaView>
  );
}

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
  displayName: { fontWeight: '800' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8, marginTop: Space.s8 },
  pill: {
    backgroundColor: Colors.surface2, borderRadius: Radius.pill,
    paddingHorizontal: Space.s12, paddingVertical: Space.s4,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  socialRow: { flexDirection: 'row', marginTop: Space.s8 },
  followBtn: {
    marginTop: Space.s12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
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

  statsGrid: {
    flexDirection: 'row', gap: Space.s12,
    paddingHorizontal: Space.s16, marginTop: Space.s20,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.card,
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
    borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: Space.s12,
  },
  workplaceLogo: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center',
  },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space.s16, paddingVertical: Space.s12,
    backgroundColor: Colors.surface1, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
  },
  stickyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Space.s12 },
  stickyBtn: { minWidth: 120 },
});
