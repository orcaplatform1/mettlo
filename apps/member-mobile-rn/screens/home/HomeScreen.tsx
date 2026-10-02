import React from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloSectionHeader } from '../../components/ui/MettloSectionHeader';
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

  const coaches      = coachData?.items ?? [];
  const programs     = programData?.items ?? [];
  const challenges   = challengeData?.items ?? [];
  const liveSessions = liveData?.items ?? [];
  const gyms         = gymData?.items ?? [];
  const restaurants  = restaurantData?.items ?? [];
  const events       = eventData?.items ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Hero image (tam genişlik, web ile birebir) ── */}
        <View style={{ width: SW, height: SW * 1.18, overflow: 'hidden' }}>
          <ExpoImage source={require('../../assets/hero.webp')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(11,18,32,0.4)', 'rgba(11,18,32,0.88)', '#0B1220']}
            locations={[0.25, 0.55, 0.80, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Logo üst sol */}
          <View style={styles.heroLogoRow}>
            <Image source={require('../../assets/icon.png')} style={styles.heroLogo} resizeMode="contain" />
            <MettloText variant="h4" style={{ letterSpacing: 4, fontWeight: '900' }}>METTLO</MettloText>
          </View>
          {/* Metin + buton alt */}
          <View style={styles.heroBottom}>
            <MettloText variant="h1" style={styles.heroTitle}>
              {'Bugün Başla.\n'}
              <MettloText variant="h1" color={Colors.primary}>Kendini Yeniden Keşfet.</MettloText>
            </MettloText>
            <MettloText variant="body" color="rgba(249,250,251,0.78)" style={{ lineHeight: 22, marginTop: 8 }}>
              Sana özel programlar, uzman koçlar, gelişim takibi ve günlük alışkanlıklar.
            </MettloText>
            <MettloButton
              label="Hemen Başla →"
              size="lg"
              fullWidth
              onPress={() => nav.navigate('Explore')}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>

        {/* ── Branşlar (web görsel ile) ── */}
        <View style={styles.section}>
          <MettloSectionHeader title="Branşlar" subtitle="KEŞFET" cta="Tümü" onCta={() => nav.navigate('Explore')} />
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
            <MettloSectionHeader title="Uzman Koçlar" subtitle="KEŞFET" cta="Tümü →" onCta={() => nav.navigate('Explore')} />
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
            <MettloSectionHeader title="Popüler Programlar" subtitle="PROGRAMLAR" cta="Tümü →" onCta={() => nav.navigate('Programs')} />
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
            <MettloSectionHeader title="Canlı Dersler" subtitle="LIVE" cta="Tümü →" onCta={() => nav.navigate('Live')} />
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
            <MettloSectionHeader title="Aktif Challenge'lar" subtitle="CHALLENGE" cta="Tümü →" onCta={() => nav.navigate('Challenges')} />
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
            <MettloSectionHeader title="Fitness İşletmeleri" subtitle="İŞLETMELER" cta="Tümü →" onCta={() => nav.navigate('BusinessList', { category: 'FITNESS_GYM' })} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {gyms.map((b: any) => (
                <Pressable key={b.id} style={styles.bizCard} onPress={() => nav.navigate('BusinessList', {})}>
                  <View style={styles.bizLogo}>
                    {b.logoUrl
                      ? <ExpoImage source={{ uri: b.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      : <MettloText style={{ fontSize: 24 }}>🏋️</MettloText>}
                  </View>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={1}>{b.name}</MettloText>
                  {b.city && <MettloText variant="caption" color={Colors.textMuted}>📍 {b.city.name ?? b.city}</MettloText>}
                  {b.ratingAvg && <MettloText variant="caption" color={Colors.highlight}>★ {parseFloat(b.ratingAvg).toFixed(1)}</MettloText>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Restoranlar & Kafeler ── */}
        {restaurants.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Restoranlar & Kafeler" subtitle="SAĞLIKLI BESLENME" cta="Tümü →" onCta={() => nav.navigate('BusinessList', { category: 'HEALTHY_FOOD' })} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {restaurants.map((b: any) => (
                <Pressable key={b.id} style={styles.bizCard} onPress={() => nav.navigate('BusinessList', {})}>
                  <View style={styles.bizLogo}>
                    {b.logoUrl
                      ? <ExpoImage source={{ uri: b.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      : <MettloText style={{ fontSize: 24 }}>🥗</MettloText>}
                  </View>
                  <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={1}>{b.name}</MettloText>
                  {b.city && <MettloText variant="caption" color={Colors.textMuted}>📍 {b.city.name ?? b.city}</MettloText>}
                  {b.ratingAvg && <MettloText variant="caption" color={Colors.highlight}>★ {parseFloat(b.ratingAvg).toFixed(1)}</MettloText>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Etkinlikler ── */}
        {events.length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Yaklaşan Etkinlikler" subtitle="ETKİNLİKLER" cta="Tümü →" onCta={() => {}} />
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

        {/* ── İş İlanları Banner ── */}
        <View style={styles.section}>
          <Pressable style={styles.jobsBanner} onPress={() => {}}>
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

  heroLogoRow: { position: 'absolute', top: 56, left: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroLogo: { width: 32, height: 32 },
  heroBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
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
    width: 140, backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: Space.s12, gap: Space.s4,
  },
  bizLogo: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: Space.s8,
  },

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

  jobsBanner: { marginHorizontal: Space.s16, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  jobsBannerInner: { padding: Space.s20 },
  jobsBtn: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.pill, paddingHorizontal: Space.s16, paddingVertical: Space.s8,
  },
});
