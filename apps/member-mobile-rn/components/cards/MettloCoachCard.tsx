import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from '../ui/MettloText';
import { MettloBadge } from '../ui/MettloBadge';
import { VerifiedBadgeOverlay } from '../ui/VerifiedBadge';
import { Colors, Radius, Space, Typography } from '../../constants/tokens';

export interface CoachCardData {
  id: string; name: string; username: string; avatarUrl?: string;
  branch?: string; specialty?: string; isVerified?: boolean;
  rating?: number; reviewCount?: number; price?: string;
  bio?: string;
}

interface Props { coach: CoachCardData; onPress: () => void }

export function MettloCoachCard({ coach, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}>
      <View style={styles.avatarWrap}>
        {coach.avatarUrl ? (
          <Image source={{ uri: coach.avatarUrl }} style={styles.avatar} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <MettloText style={styles.avatarInitial}>{coach.name[0]?.toUpperCase()}</MettloText>
          </View>
        )}
        {coach.isVerified && <VerifiedBadgeOverlay avatarSize={64} />}
      </View>

      <View style={styles.body}>
        <MettloText variant="h5" numberOfLines={1}>{coach.name}</MettloText>
        {coach.branch && <MettloText variant="caption" color={Colors.primary} style={styles.branch}>{coach.branch}</MettloText>}
        {coach.specialty && <MettloText variant="bodySm" color={Colors.textSecondary} numberOfLines={1}>{coach.specialty}</MettloText>}

        <View style={styles.row}>
          {coach.rating != null && (
            <MettloText variant="caption" color={Colors.highlight}>★ {coach.rating.toFixed(1)}</MettloText>
          )}
          {coach.price && (
            <MettloText variant="caption" color={Colors.textMuted}>{coach.price}</MettloText>
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
    padding: Space.s12, gap: Space.s10, width: 160,
  },
  avatarWrap: { position: 'relative', alignSelf: 'flex-start' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...Typography.h4, color: Colors.textPrimary },
  body: { gap: Space.s4 },
  branch: { fontWeight: '600', letterSpacing: 0.3 },
  row: { flexDirection: 'row', gap: Space.s8, marginTop: Space.s4 },
});
