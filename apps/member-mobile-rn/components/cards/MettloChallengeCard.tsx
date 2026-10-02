import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MettloText } from '../ui/MettloText';
import { MettloBadge } from '../ui/MettloBadge';
import { Colors, Radius, Space } from '../../constants/tokens';

export interface ChallengeCardData {
  id: string; slug: string; title: string; coverUrl?: string;
  status: 'active' | 'upcoming' | 'completed';
  daysLeft?: number; participantCount?: number;
  xpReward?: number; isJoined?: boolean;
}

interface Props { challenge: ChallengeCardData; onPress: () => void }

export function MettloChallengeCard({ challenge, onPress }: Props) {
  const statusLabel = challenge.status === 'active' ? 'Aktif' : challenge.status === 'upcoming' ? 'Yakında' : 'Tamamlandı';
  const statusVariant = challenge.status === 'active' ? 'success' : challenge.status === 'upcoming' ? 'surface' : 'error';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}>
      <View style={styles.cover}>
        {challenge.coverUrl ? (
          <Image source={{ uri: challenge.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={['#F97316', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.coverOverlay}>
          <MettloBadge label={statusLabel} variant={statusVariant} />
        </View>
      </View>
      <View style={styles.body}>
        <MettloText variant="h5" numberOfLines={2}>{challenge.title}</MettloText>
        <View style={styles.row}>
          {challenge.participantCount != null && (
            <MettloText variant="caption" color={Colors.textMuted}>👥 {challenge.participantCount}</MettloText>
          )}
          {challenge.xpReward != null && (
            <MettloText variant="caption" color={Colors.highlight}>+{challenge.xpReward} XP</MettloText>
          )}
          {challenge.daysLeft != null && challenge.status === 'active' && (
            <MettloText variant="caption" color={Colors.textMuted}>{challenge.daysLeft} gün kaldı</MettloText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    overflow: 'hidden', width: 200,
  },
  cover: { height: 110, backgroundColor: Colors.surface2 },
  coverOverlay: { ...StyleSheet.absoluteFill, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: Space.s10, justifyContent: 'flex-start' },
  body: { padding: Space.s12, gap: Space.s8 },
  row: { flexDirection: 'row', gap: Space.s10, flexWrap: 'wrap' },
});
