import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from '../ui/MettloText';
import { MettloAvatar } from '../ui/MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';

export interface LiveCardData {
  id: string; slug: string; title: string;
  coachName: string; coachAvatarUrl?: string;
  scheduledAt: string; durationMinutes?: number;
  isLive?: boolean; participantCount?: number;
  branch?: string; price?: string;
}

interface Props { session: LiveCardData; onPress: () => void }

export function MettloLiveCard({ session, onPress }: Props) {
  const date = new Date(session.scheduledAt);
  const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}>
      {session.isLive && (
        <LinearGradient
          colors={['rgba(249,115,22,0.15)', 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.card }]}
        />
      )}

      <View style={styles.header}>
        <MettloAvatar uri={session.coachAvatarUrl} name={session.coachName} size={40} />
        <View style={styles.headerRight}>
          {session.isLive && (
            <View style={styles.liveDot}>
              <View style={styles.liveDotInner} />
              <MettloText variant="caption" style={styles.liveText}>CANLI</MettloText>
            </View>
          )}
          <MettloText variant="bodySm" color={Colors.textMuted}>{session.coachName}</MettloText>
        </View>
      </View>

      <MettloText variant="h5" numberOfLines={2} style={styles.title}>{session.title}</MettloText>

      <View style={styles.footer}>
        <MettloText variant="caption" color={Colors.textMuted}>{dateStr} · {timeStr}</MettloText>
        {session.durationMinutes && <MettloText variant="caption" color={Colors.textMuted}>{session.durationMinutes} dk</MettloText>}
        {session.price && <MettloText variant="caption" color={Colors.primary} style={{ fontWeight: '700' }}>{session.price}</MettloText>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: Space.s14, gap: Space.s10, width: 220,
  },
  header: { flexDirection: 'row', gap: Space.s10, alignItems: 'center' },
  headerRight: { flex: 1, gap: Space.s2 },
  liveDot: { flexDirection: 'row', alignItems: 'center', gap: Space.s4 },
  liveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.error },
  liveText: { color: Colors.error, fontWeight: '700', letterSpacing: 0.5 },
  title: { lineHeight: 22 },
  footer: { flexDirection: 'row', gap: Space.s10, flexWrap: 'wrap' },
});
