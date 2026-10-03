import React from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloSectionHeader } from '../../components/ui/MettloSectionHeader';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { MettloCoachCard } from '../../components/cards/MettloCoachCard';
import { MettloProgramCard } from '../../components/cards/MettloProgramCard';
import { MettloChallengeCard } from '../../components/cards/MettloChallengeCard';
import { MettloLiveCard } from '../../components/cards/MettloLiveCard';
import { Colors, Space, Radius } from '../../constants/tokens';
import { coachService } from '../../services/coachService';
import { programService } from '../../services/programService';
import { challengeService } from '../../services/challengeService';
import { liveService } from '../../services/liveService';
import { businessService } from '../../services/businessService';
import { eventService } from '../../services/eventService';
import { storeService } from '../../services/storeService';
import { absUrl } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SW } = Dimensions.get('window');

const BRANCHES: { slug: string; label: string; img: any }[] = [
  { slug: 'fitness',           label: 'Fitness',    img: require('../../assets/icons/fitness.webp') },
  { slug: 'yoga-mobility',     label: 'Yoga',       img: require('../../assets/icons/yoga-mobility.webp') },
  { slug: 'pilates',           label: 'Pilates',    img: require('../../assets/icons/pilates.webp') },
  { slug: 'hiit-cardio',       label: 'HIIT',       img: require('../../assets/icons/hiit-cardio.webp') },
  { slug: 'nutrition',         label: 'Beslenme',   img: require('../../assets/icons/nutrition.webp') },
  { slug: 'meditation',        label: 'Meditasyon', img: require('../../assets/icons/meditation.webp') },
  { slug: 'boxing-kickboxing', label: 'Boks',       img: require('../../assets/icons/boxing-kickboxing.webp') },
  { slug: 'running',           label: 'Koşu',       img: require('../../assets/icons/running.webp') },
  { slug: 'dance',             label: 'Dans',       img: require('../../assets/icons/dance.webp') },
];

export function HomeScreen() {
  const nav = useNavigation<Nav>();

  const { data: coachData } = useQuery({
    queryKey: ['home-coaches'],
    queryFn: () => coachService.list({ limit: 8 } as any),
  });

  const { data: programData } = useQuery({
    queryKey: ['home-programs'],
    queryFn: () => programService.list({ page: 1 }),
  });

  const { data: challengeData } = useQuery({
    queryKey: ['home-challenges'],
    queryFn: () => challengeService.list({ status: 'active' }),
  });

  const { data: liveData } = useQuery({
    queryKey: ['home-live'],
    queryFn: () => liveService.list({ upcoming: true }),
  });

  const { data: gymData } = useQuery({
    queryKey: ['home-gyms'],
    queryFn: () => businessService.list({ category: 'FITNESS_GYM', limit: 6 } as any),
  });

  const { data: restaurantData } = useQuery({
    queryKey: ['home-restaurants'],
    queryFn: () => businessService.list({ category: 'HEALTHY_FOOD', limit: 6 } as any),
  });

  const { data: eventData } = useQuery({
    queryKey: ['home-events'],
    queryFn: () => eventService.list({ limit: 6 }),
  });

  const { data: storeData } = useQuery({
    queryKey: ['home-store'],
    queryFn: () => storeService.products({ page: 1 }),
  });

  const coaches      = coachData?.items ?? [];
  const programs     = programData?.items ?? [];
  const challenges   = challengeData?.items ?? [];
  const liveSessions = liveData?.items ?? [];
  const gyms         = gymData?.items ?? [];
  const restaurants  = restaurantData?.items ?? [];
  const events       = eventData?.items ?? [];
  const storeItems   = storeData?.items ?? storeData?.products ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Hero ── */}
        <View>
          {/* Görsel — 2172×724 yatay; %68 sağa kaydırılmış: erkek→köpek→kız→PC/tel/saat görünür */}
          <View style={{ width: SW, height: SW * 0.60, overflow: 'hidden' }}>
            <ExpoImage
              source={require('../../assets/hero.webp')}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ left: '100%' }}
            />
            {/* Alttan hafif karartma */}
            <LinearGradient
              colors={['transparent', 'rgba(11,18,32,0.55)']}
              locations={[0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            {/* Logo sol üst */}
            <View style={styles.heroLogoRow}>
              <Image source={require('../../assets/icon.png')} style={styles.heroLogo} resizeMode="contain" />
              <MettloText variant="h4" style={{ letterSpacing: 4, fontWeight: '900' }}>METTLO</MettloText>
            </View>
          </View>

        </View>

        {/* ── Branşlar (web görsel ile) ── */}
        <View style={styles.section}>
          <MettloSectionHeader title="Branşlar" cta="Tümü" onCta={() => nav.navigate('Explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
            {BRANCHES.map((b) => (
              <Pressable key={b.slug} style={({ pressed }) => [styles.branchCard, { opacity: pressed ? 0.85 : 1 }]} onPress={() => nav.navigate('Explore')}>
                <ExpoImage source={b.img} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={[StyleSheet.absoluteFill]} />
                <MettloText style={styles.branchLabel} numberOfLines={1}>{b.label}</MettloText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Uzman Koçlar ── */}
        {coaches.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Uzman Koçlar" cta="Tümü →" onCta={() => nav.navigate('Explore')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {coaches.map((coach: any) => (
                <MettloCoachCard
                  key={coach.user?.username ?? coach.displayName}
                  coach={{
                    id: coach.user?.username ?? coach.displayName ?? '',
                    name: coach.displayName ?? coach.user?.username ?? '',
                    username: coach.user?.username ?? '',
                    avatarUrl: coach.user?.avatarUrl,
                    branch: coach.branches?.[0]?.name,
                    specialty: coach.headline,
                    isVerified: coach.verified,
                    rating: coach.ratingAvg ? parseFloat(coach.ratingAvg) : undefined,
                    reviewCount: coach.ratingCount,
                  }}
                  onPress={() => nav.navigate('CoachDetail', { username: coach.user?.username ?? '' })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Popüler Programlar ── */}
        {programs.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Popüler Programlar" cta="Tümü →" onCta={() => nav.navigate('Programs')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {programs.map((p: any) => (
                <MettloProgramCard key={p.slug} program={p} onPress={() => nav.navigate('ProgramDetail', { slug: p.slug })} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Canlı Dersler ── */}
        {liveSessions.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Canlı Dersler" cta="Tümü →" onCta={() => nav.navigate('Live')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {liveSessions.map((s: any) => (
                <MettloLiveCard key={s.id} session={s} onPress={() => nav.navigate('Live')} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Challenge'lar ── */}
        {challenges.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Aktif Challenge'lar" cta="Tümü →" onCta={() => nav.navigate('Challenges')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {challenges.map((c: any) => (
                <MettloChallengeCard key={c.id ?? c.slug} challenge={c} onPress={() => nav.navigate('ChallengeDetail', { slug: c.slug })} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Fitness İşletmeleri ── */}
        {gyms.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Fitness İşletmeleri" cta="Tümü →" onCta={() => nav.navigate('BusinessList', { category: 'FITNESS_GYM' })} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {gyms.map((b: any) => {
                const isVerified = b.verificationStatus === 'VERIFIED' || b.verificationStatus === 'APPROVED';
                const rating = Number(b.ratingAvg);
                return (
                  <Pressable key={b.id} style={({ pressed }) => [styles.bizCard, { opacity: pressed ? 0.85 : 1 }]} onPress={() => nav.navigate('BusinessList', {})}>
                    <LinearGradient colors={['rgba(249,115,22,0.08)', 'rgba(17,9,40,0.0)']} style={StyleSheet.absoluteFill} />
                    {/* Logo + isim satırı */}
                    <View style={styles.bizHeader}>
                      <MettloAvatar uri={absUrl(b.logoUrl)} name={b.name} size={52} verified={isVerified} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <MettloText style={styles.bizName} numberOfLines={1}>{b.name}</MettloText>
                        {b.slug && <MettloText variant="caption" color={Colors.textMuted} numberOfLines={1}>@{b.slug}</MettloText>}
                      </View>
                    </View>
                    {b.city && (
                      <MettloText variant="caption" color={Colors.textMuted} style={{ marginTop: Space.s8 }}>📍 {b.city?.name ?? b.city}</MettloText>
                    )}
                    {rating > 0 && (
                      <View style={styles.bizRating}>
                        <MettloText style={styles.bizStar}>★</MettloText>
                        <MettloText variant="caption" style={{ fontWeight: '700' }}>{rating.toFixed(1)}</MettloText>
                        <MettloText variant="caption" color={Colors.textMuted}>({b.ratingCount ?? 0} yorum)</MettloText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Restoranlar & Kafeler ── */}
        {restaurants.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Restoranlar & Kafeler" cta="Tümü →" onCta={() => nav.navigate('BusinessList', { category: 'HEALTHY_FOOD' })} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {restaurants.map((b: any) => {
                const isVerified = b.verificationStatus === 'VERIFIED' || b.verificationStatus === 'APPROVED';
                const rating = Number(b.ratingAvg);
                return (
                  <Pressable key={b.id} style={({ pressed }) => [styles.bizCard, { opacity: pressed ? 0.85 : 1 }]} onPress={() => nav.navigate('BusinessList', {})}>
                    <LinearGradient colors={['rgba(249,115,22,0.08)', 'rgba(17,9,40,0.0)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.bizHeader}>
                      <MettloAvatar uri={absUrl(b.logoUrl)} name={b.name} size={52} verified={isVerified} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <MettloText style={styles.bizName} numberOfLines={1}>{b.name}</MettloText>
                        {b.slug && <MettloText variant="caption" color={Colors.textMuted} numberOfLines={1}>@{b.slug}</MettloText>}
                      </View>
                    </View>
                    {b.city && (
                      <MettloText variant="caption" color={Colors.textMuted} style={{ marginTop: Space.s8 }}>📍 {b.city?.name ?? b.city}</MettloText>
                    )}
                    {rating > 0 && (
                      <View style={styles.bizRating}>
                        <MettloText style={styles.bizStar}>★</MettloText>
                        <MettloText variant="caption" style={{ fontWeight: '700' }}>{rating.toFixed(1)}</MettloText>
                        <MettloText variant="caption" color={Colors.textMuted}>({b.ratingCount ?? 0} yorum)</MettloText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Etkinlikler ── */}
        {events.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Yaklaşan Etkinlikler" cta="Tümü →" onCta={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {events.map((e: any) => {
                const date = e.startsAt ? new Date(e.startsAt) : null;
                const dateStr = date ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';
                return (
                  <Pressable key={e.id} style={styles.eventCard}>
                    <View style={styles.eventDateBadge}>
                      <MettloText style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>{dateStr}</MettloText>
                    </View>
                    <MettloText variant="bodySm" style={{ fontWeight: '700', marginTop: Space.s8 }} numberOfLines={2}>{e.title}</MettloText>
                    {e.locationName && <MettloText variant="caption" color={Colors.textMuted} numberOfLines={1}>📍 {e.locationName}</MettloText>}
                    {e.ticketPriceKurus != null && (
                      <MettloText variant="caption" color={Colors.primary} style={{ marginTop: Space.s4 }}>
                        {e.ticketPriceKurus === 0 ? 'Ücretsiz' : `₺${(e.ticketPriceKurus / 100).toFixed(0)}`}
                      </MettloText>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Mettlo Mağaza ── */}
        <View style={styles.section}>
          <MettloSectionHeader title="Mettlo Mağaza" cta="Tümüne Bak →" onCta={() => nav.navigate('Store')} />
          {storeItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {storeItems.slice(0, 8).map((p: any) => (
                <Pressable key={p.id} style={({ pressed }) => [styles.storeCard, { opacity: pressed ? 0.85 : 1 }]} onPress={() => nav.navigate('Store')}>
                  <View style={styles.storeImage}>
                    {p.imageUrl
                      ? <ExpoImage source={{ uri: absUrl(p.imageUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      : <LinearGradient colors={[Colors.surface2, Colors.surface3]} style={StyleSheet.absoluteFill} />}
                  </View>
                  <View style={styles.storeBody}>
                    <MettloText variant="bodySm" numberOfLines={2} style={{ fontWeight: '600' }}>{p.title ?? p.name}</MettloText>
                    <MettloText variant="caption" color={Colors.primary} style={{ fontWeight: '700', marginTop: Space.s4 }}>
                      {p.priceKurus != null ? `₺${(p.priceKurus / 100).toFixed(0)}` : p.price ?? ''}
                    </MettloText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Pressable style={styles.storeBanner} onPress={() => nav.navigate('Store')}>
              <LinearGradient colors={['rgba(249,115,22,0.13)', 'rgba(236,72,153,0.09)']} style={styles.storeBannerInner}>
                <MettloText style={{ fontSize: 36 }}>🛍️</MettloText>
                <MettloText variant="h4" style={{ marginTop: Space.s8 }}>Spor Giyim & Ekipman</MettloText>
                <MettloText variant="bodySm" color={Colors.textMuted} style={{ marginTop: Space.s4 }}>
                  Takviye, giyim ve spor ekipmanları çok yakında.
                </MettloText>
                <View style={[styles.jobsBtn, { marginTop: Space.s12 }]}>
                  <MettloText variant="bodySm" style={{ fontWeight: '700', color: Colors.primary }}>Mağazaya Git →</MettloText>
                </View>
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* ── İş İlanları Banner ── */}
        <View style={styles.section}>
          <Pressable style={styles.jobsBanner} onPress={() => nav.navigate('JobApplications')}>
            <LinearGradient colors={['rgba(249,115,22,0.12)', 'rgba(236,72,153,0.08)']} style={styles.jobsBannerInner}>
              <MettloText variant="caption" color={Colors.primary} style={{ letterSpacing: 1, fontWeight: '700' }}>FİTNESS SEKTÖRÜNDE KARİYER</MettloText>
              <MettloText variant="h4" style={{ marginTop: Space.s4 }}>İş İlanları</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted} style={{ marginTop: Space.s4 }}>
                Spor salonları, koçlar ve fitness işletmeleri için iş ilanlarını gör. Kariyer fırsatlarını kaçırma.
              </MettloText>
              <View style={[styles.jobsBtn, { marginTop: Space.s12 }]}>
                <MettloText variant="bodySm" style={{ fontWeight: '700', color: Colors.primary }}>İş İlanlarını Gör →</MettloText>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: Space.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },

  heroLogoRow: { position: 'absolute', top: 16, left: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroLogo: { width: 32, height: 32 },
  heroBottom: { padding: 20, paddingTop: 16 },
  heroTitle: { fontWeight: '800', lineHeight: 38 },

  section: { marginTop: 4 },
  hList: { paddingHorizontal: Space.s16, gap: Space.s12, paddingVertical: Space.s8 },

  branchCard: {
    width: 100, height: 124, borderRadius: Radius.lg, overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  branchLabel: {
    color: '#fff', fontWeight: '700', fontSize: 12,
    paddingHorizontal: 8, paddingBottom: 8,
  },

  bizCard: {
    width: 210, backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.18)',
    padding: Space.s14, overflow: 'hidden',
    shadowColor: '#F97316', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bizHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.s12 },
  bizLogoImg: { borderRadius: Radius.md, flexShrink: 0 },
  bizName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  bizRating: { flexDirection: 'row', alignItems: 'center', gap: Space.s4, marginTop: Space.s8 },
  bizStar: { fontSize: 13, color: '#f59e0b' },

  storeCard: {
    width: 150, backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle, overflow: 'hidden',
  },
  storeImage: { height: 130 },
  storeBody: { padding: Space.s10 },

  eventCard: {
    width: 180, backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: Space.s14,
  },
  eventDateBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(249,115,22,0.12)',
    borderRadius: Radius.pill, paddingHorizontal: Space.s10, paddingVertical: Space.s4,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
  },

  storeBanner: { marginHorizontal: Space.s16, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  storeBannerInner: { padding: Space.s20 },
  jobsBanner: { marginHorizontal: Space.s16, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  jobsBannerInner: { padding: Space.s20 },
  jobsBtn: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.pill, paddingHorizontal: Space.s16, paddingVertical: Space.s8,
  },
});
