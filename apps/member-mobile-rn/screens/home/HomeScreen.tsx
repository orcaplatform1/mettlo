import React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloSectionHeader } from '../../components/ui/MettloSectionHeader';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloCoachCard } from '../../components/cards/MettloCoachCard';
import { MettloProgramCard } from '../../components/cards/MettloProgramCard';
import { MettloChallengeCard } from '../../components/cards/MettloChallengeCard';
import { MettloLiveCard } from '../../components/cards/MettloLiveCard';
import { Colors, Space, Radius } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { coachService } from '../../services/coachService';
import { programService } from '../../services/programService';
import { challengeService } from '../../services/challengeService';
import { liveService } from '../../services/liveService';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BRANCHES = [
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'yoga-mobility', label: 'Yoga', emoji: '🧘' },
  { id: 'pilates-core', label: 'Pilates', emoji: '🤸' },
  { id: 'hiit-cardio', label: 'HIIT', emoji: '🔥' },
  { id: 'nutrition', label: 'Beslenme', emoji: '🥗' },
  { id: 'meditation', label: 'Meditasyon', emoji: '🌿' },
  { id: 'running', label: 'Koşu', emoji: '🏃' },
  { id: 'boxing', label: 'Boks', emoji: '🥊' },
  { id: 'dance', label: 'Dans', emoji: '💃' },
];

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const { data: coaches, isLoading: coachLoading } = useQuery({
    queryKey: ['coaches', 'featured'],
    queryFn: () => coachService.list({ page: 1 }),
  });

  const { data: programs, isLoading: progLoading } = useQuery({
    queryKey: ['programs', 'featured'],
    queryFn: () => programService.list({ page: 1 }),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: () => challengeService.list({ status: 'active' }),
  });

  const { data: live } = useQuery({
    queryKey: ['live', 'upcoming'],
    queryFn: () => liveService.list({ upcoming: true }),
  });

  const greeting = user ? `Merhaba, ${user.name.split(' ')[0]}` : 'Merhaba';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <MettloText variant="caption" color={Colors.textMuted}>{greeting} 👋</MettloText>
            <MettloText variant="h2">Bugün ne yapalım?</MettloText>
          </View>
          {user && (
            <View style={styles.xpBadge}>
              <MettloText variant="caption" color={Colors.highlight}>⚡ {user.xp ?? 0} XP</MettloText>
            </View>
          )}
        </View>

        {/* Hero */}
        <LinearGradient
          colors={['#0D0B1F', '#110928', '#0B1220']}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <MettloText variant="caption" color={Colors.primary} style={styles.heroBadgeText}>🔥 Daha Güçlü Bir Sen</MettloText>
          </View>
          <MettloText variant="h1" style={styles.heroTitle}>
            Değişime Hazırsan,{'\n'}
            <MettloText variant="h1" style={styles.heroGradientText}>Yolun Mettlo</MettloText>
          </MettloText>
          <MettloText variant="body" color={Colors.textSecondary} style={styles.heroDesc}>
            Sana özel programlar, uzman koçlar, gelişim takibi ve günlük alışkanlıklar.
          </MettloText>
          <View style={styles.heroCtas}>
            <MettloButton label="Hemen Başla" onPress={() => nav.navigate('Explore')} size="md" />
            <MettloButton label="Keşfet" onPress={() => nav.navigate('Explore')} variant="outline" size="md" />
          </View>
        </LinearGradient>

        {/* Branşlar */}
        <View style={styles.section}>
          <MettloSectionHeader title="Branşlar" subtitle="Keşfet" cta="Tümü" onCta={() => nav.navigate('Explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
            {BRANCHES.map((b) => (
              <Pressable
                key={b.id}
                style={styles.branchChip}
                onPress={() => nav.navigate('Explore')}
              >
                <MettloText style={styles.branchEmoji}>{b.emoji}</MettloText>
                <MettloText variant="caption" color={Colors.textSecondary}>{b.label}</MettloText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Öne Çıkan Koçlar */}
        <View style={styles.section}>
          <MettloSectionHeader title="Uzman Koçlar" subtitle="Keşfet" cta="Tümü →" onCta={() => nav.navigate('Explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
            {(coaches?.items ?? coaches?.coaches ?? []).slice(0, 6).map((coach: any) => (
              <MettloCoachCard
                key={coach.id}
                coach={coach}
                onPress={() => nav.navigate('CoachDetail', { username: coach.username })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Programlar */}
        <View style={styles.section}>
          <MettloSectionHeader title="Popüler Programlar" subtitle="Programlar" cta="Tümü →" onCta={() => nav.navigate('Programs')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
            {(programs?.items ?? programs?.programs ?? []).slice(0, 6).map((p: any) => (
              <MettloProgramCard
                key={p.id}
                program={p}
                onPress={() => nav.navigate('ProgramDetail', { slug: p.slug })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Canlı Dersler */}
        {(live?.items ?? live?.sessions ?? []).length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Canlı Dersler" subtitle="Live" cta="Tümü →" onCta={() => nav.navigate('Live')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
              {(live?.items ?? live?.sessions ?? []).slice(0, 4).map((s: any) => (
                <MettloLiveCard key={s.id} session={s} onPress={() => nav.navigate('Live')} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Challenge'lar */}
        {(challenges?.items ?? challenges?.challenges ?? []).length > 0 && (
          <View style={styles.section}>
            <MettloSectionHeader title="Aktif Challenge'lar" subtitle="Challenge" cta="Tümü →" onCta={() => nav.navigate('Challenges')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
              {(challenges?.items ?? challenges?.challenges ?? []).slice(0, 4).map((c: any) => (
                <MettloChallengeCard key={c.id} challenge={c} onPress={() => nav.navigate('ChallengeDetail', { slug: c.slug })} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s16, gap: Space.s12 },
  xpBadge: { backgroundColor: 'rgba(253,224,71,0.12)', borderRadius: Radius.pill, paddingHorizontal: Space.s12, paddingVertical: Space.s6, borderWidth: 1, borderColor: 'rgba(253,224,71,0.25)' },
  hero: { marginHorizontal: Space.s16, borderRadius: Radius.hero, padding: Space.s24, gap: Space.s16, marginBottom: Space.s8, borderWidth: 1, borderColor: Colors.borderSubtle },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(249,115,22,0.12)', borderRadius: Radius.pill, paddingHorizontal: Space.s12, paddingVertical: Space.s4, borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)' },
  heroBadgeText: { fontWeight: '600', letterSpacing: 0.3 },
  heroTitle: { lineHeight: 38 },
  heroGradientText: { color: Colors.primary },
  heroDesc: { lineHeight: 24 },
  heroCtas: { flexDirection: 'row', gap: Space.s12 },
  section: { paddingHorizontal: Space.s16, paddingVertical: Space.s20 },
  hScroll: { marginHorizontal: -Space.s16 },
  hScrollContent: { paddingHorizontal: Space.s16, gap: Space.s12 },
  branchChip: {
    backgroundColor: Colors.surface2, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle,
    paddingHorizontal: Space.s14, paddingVertical: Space.s12, alignItems: 'center', gap: Space.s4, minWidth: 72,
  },
  branchEmoji: { fontSize: 24 },
  bottomPad: { height: Space.s32 },
});
