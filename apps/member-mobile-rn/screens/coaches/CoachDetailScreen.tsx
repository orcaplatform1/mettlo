import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloErrorState } from '../../components/ui/MettloErrorState';
import { MettloProgramCard } from '../../components/cards/MettloProgramCard';
import { Colors, Radius, Space } from '../../constants/tokens';
import { coachService } from '../../services/coachService';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'CoachDetail'>;

export function CoachDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { username } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coach', username],
    queryFn: () => coachService.getProfile(username),
  });

  const { data: packages } = useQuery({
    queryKey: ['coach-packages', username],
    queryFn: () => coachService.getPackages(username),
    enabled: !!data,
  });

  if (isLoading) return <MettloLoadingState />;
  if (isError || !data) return <MettloErrorState onRetry={refetch} />;

  const c = data.coach ?? data;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header gradient */}
        <LinearGradient colors={['#0D0B1F', '#110928', Colors.bg]} style={styles.headerBg}>
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <MettloText color={Colors.textPrimary}>← Geri</MettloText>
          </Pressable>
          <View style={styles.profileRow}>
            <MettloAvatar uri={c.avatarUrl} name={c.name} size={80} verified={c.isVerified} />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <MettloText variant="h3">{c.name}</MettloText>
                {c.isVerified && <MettloBadge label="✓ Doğrulandı" variant="verified" />}
              </View>
              <MettloText variant="bodySm" color={Colors.textMuted}>@{c.username}</MettloText>
              {c.branch && <MettloText variant="caption" color={Colors.primary}>{c.branch}</MettloText>}
            </View>
          </View>

          <View style={styles.stats}>
            {c.rating != null && (
              <View style={styles.stat}><MettloText variant="h4" color={Colors.highlight}>★ {c.rating.toFixed(1)}</MettloText><MettloText variant="caption" color={Colors.textMuted}>Puan</MettloText></View>
            )}
            {c.reviewCount != null && (
              <View style={styles.stat}><MettloText variant="h4">{c.reviewCount}</MettloText><MettloText variant="caption" color={Colors.textMuted}>Yorum</MettloText></View>
            )}
            {c.clientCount != null && (
              <View style={styles.stat}><MettloText variant="h4">{c.clientCount}</MettloText><MettloText variant="caption" color={Colors.textMuted}>Öğrenci</MettloText></View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {c.bio && (
            <View style={styles.section}>
              <MettloText variant="h5">Hakkımda</MettloText>
              <MettloText variant="body" color={Colors.textSecondary}>{c.bio}</MettloText>
            </View>
          )}

          {c.specialties && c.specialties.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5">Uzmanlıklar</MettloText>
              <View style={styles.tags}>
                {c.specialties.map((s: string) => <MettloBadge key={s} label={s} variant="surface" />)}
              </View>
            </View>
          )}

          {/* Paketler */}
          {(packages?.items ?? packages?.packages ?? []).length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5">1:1 Koçluk Paketleri</MettloText>
              {(packages?.items ?? packages?.packages ?? []).map((pkg: any) => (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageTop}>
                    <MettloText variant="h5">{pkg.title}</MettloText>
                    <MettloText variant="h4" color={Colors.primary}>{pkg.price}</MettloText>
                  </View>
                  <MettloText variant="bodySm" color={Colors.textSecondary}>{pkg.description}</MettloText>
                  <MettloText variant="caption" color={Colors.textMuted}>{pkg.durationMinutes} dk · {pkg.sessionCount} seans</MettloText>
                  <MettloButton label="Rezervasyon Yap" onPress={() => {/* TODO: booking flow */}} variant="outline" size="sm" style={{ alignSelf: 'flex-start', marginTop: Space.s8 }} />
                </View>
              ))}
            </View>
          )}

          {/* Programlar */}
          {c.programs && c.programs.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5">Programları</MettloText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Space.s20 }} contentContainerStyle={{ paddingHorizontal: Space.s20, gap: Space.s12 }}>
                {c.programs.slice(0, 5).map((p: any) => (
                  <MettloProgramCard key={p.id} program={p} onPress={() => {
                    // @ts-ignore
                    nav.navigate('ProgramDetail', { slug: p.slug });
                  }} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <MettloButton label="Mesaj Gönder" onPress={() => {/* TODO */}} variant="outline" style={{ flex: 1 }} />
        <MettloButton label="Takip Et" onPress={() => {/* TODO */}} style={{ flex: 1, marginLeft: Space.s12 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerBg: { paddingBottom: Space.s24 },
  backBtn: { paddingHorizontal: Space.s16, paddingTop: Space.s56, paddingBottom: Space.s16 },
  profileRow: { flexDirection: 'row', paddingHorizontal: Space.s20, gap: Space.s16, alignItems: 'flex-start' },
  profileInfo: { flex: 1, gap: Space.s4 },
  nameRow: { flexDirection: 'row', gap: Space.s8, alignItems: 'center', flexWrap: 'wrap' },
  stats: { flexDirection: 'row', paddingHorizontal: Space.s20, marginTop: Space.s20, gap: Space.s24 },
  stat: { gap: Space.s2, alignItems: 'center' },
  body: { padding: Space.s20, gap: Space.s24 },
  section: { gap: Space.s12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8 },
  packageCard: { backgroundColor: Colors.surface2, borderRadius: Radius.card, padding: Space.s16, gap: Space.s8, borderWidth: 1, borderColor: Colors.borderSubtle },
  packageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaBar: { flexDirection: 'row', padding: Space.s16, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, backgroundColor: Colors.surface1 },
});
