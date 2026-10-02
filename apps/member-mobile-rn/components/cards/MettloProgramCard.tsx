import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from '../ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';

export interface ProgramCardData {
  id: string; slug: string; title: string; coverUrl?: string;
  coachName?: string; durationDays?: number; level?: string;
  branch?: string; price?: string; isPurchased?: boolean;
}

interface Props { program: ProgramCardData; onPress: () => void }

export function MettloProgramCard({ program, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}>
      <View style={styles.cover}>
        {program.coverUrl ? (
          <Image source={{ uri: program.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={['#1F2937', '#111827']} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: Space.s10 }]}>
          {program.durationDays && (
            <View style={styles.durationBadge}>
              <MettloText variant="caption" style={styles.durationText}>{program.durationDays} gün</MettloText>
            </View>
          )}
        </LinearGradient>
      </View>

      <View style={styles.body}>
        {program.branch && <MettloText variant="caption" color={Colors.primary} style={styles.branch}>{program.branch}</MettloText>}
        <MettloText variant="h5" numberOfLines={2}>{program.title}</MettloText>
        {program.coachName && <MettloText variant="caption" color={Colors.textMuted}>{program.coachName}</MettloText>}
        <View style={styles.footer}>
          {program.level && <MettloText variant="caption" color={Colors.textSecondary}>{program.level}</MettloText>}
          {program.isPurchased ? (
            <MettloText variant="caption" color={Colors.success}>Sahipsiniz ✓</MettloText>
          ) : program.price ? (
            <MettloText variant="bodySm" color={Colors.primary} style={{ fontWeight: '700' }}>{program.price}</MettloText>
          ) : null}
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
  cover: { height: 120, backgroundColor: Colors.surface2 },
  body: { padding: Space.s12, gap: Space.s4 },
  branch: { fontWeight: '600', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space.s4 },
  durationBadge: {
    backgroundColor: 'rgba(249,115,22,0.85)', borderRadius: Radius.sm,
    paddingHorizontal: Space.s6, paddingVertical: 2, alignSelf: 'flex-start',
  },
  durationText: { color: '#fff', fontWeight: '600' },
});
