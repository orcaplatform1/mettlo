import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloErrorState } from '../../components/ui/MettloErrorState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { challengeService } from '../../services/challengeService';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'ChallengeDetail'>;

export function ChallengeDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { slug } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => challengeService.get(slug),
  });

  if (isLoading) return <MettloLoadingState />;
  if (isError || !data) return <MettloErrorState onRetry={refetch} />;

  const c = data.challenge ?? data;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          {c.coverUrl ? (
            <Image source={{ uri: c.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#F97316', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.3)', Colors.bg]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <MettloText color={Colors.textPrimary}>← Geri</MettloText>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.statusRow}>
            <MettloBadge label={c.status === 'active' ? 'Aktif' : c.status === 'upcoming' ? 'Yakında' : 'Tamamlandı'} variant={c.status === 'active' ? 'success' : 'surface'} />
            {c.xpReward && <MettloBadge label={`+${c.xpReward} XP`} variant="warning" />}
          </View>

          <MettloText variant="h2">{c.title}</MettloText>

          <View style={styles.stats}>
            {c.participantCount != null && (
              <View style={styles.stat}><MettloText variant="h4">{c.participantCount}</MettloText><MettloText variant="caption" color={Colors.textMuted}>Katılımcı</MettloText></View>
            )}
            {c.daysLeft != null && c.status === 'active' && (
              <View style={styles.stat}><MettloText variant="h4">{c.daysLeft}</MettloText><MettloText variant="caption" color={Colors.textMuted}>Gün Kaldı</MettloText></View>
            )}
          </View>

          {c.description && (
            <View style={styles.section}>
              <MettloText variant="h5">Hakkında</MettloText>
              <MettloText variant="body" color={Colors.textSecondary}>{c.description}</MettloText>
            </View>
          )}

          {c.rules && c.rules.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5">Kurallar</MettloText>
              {c.rules.map((r: string, i: number) => (
                <View key={i} style={styles.ruleRow}>
                  <MettloText color={Colors.primary}>•</MettloText>
                  <MettloText variant="body" color={Colors.textSecondary}>{r}</MettloText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <MettloButton
          label={c.isJoined ? 'Katıldın ✓' : 'Challenge\'a Katıl'}
          onPress={() => {/* TODO: join challenge */}}
          disabled={c.isJoined}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  cover: { height: 240 },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  body: { padding: Space.s20, gap: Space.s20 },
  statusRow: { flexDirection: 'row', gap: Space.s8 },
  stats: { flexDirection: 'row', gap: Space.s24 },
  stat: { gap: Space.s2, alignItems: 'center' },
  section: { gap: Space.s10 },
  ruleRow: { flexDirection: 'row', gap: Space.s10 },
  ctaBar: { padding: Space.s16, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, backgroundColor: Colors.surface1 },
});
