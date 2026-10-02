import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MettloButton } from './MettloButton';
import { MettloText } from './MettloText';
import { Colors, Space } from '../../constants/tokens';

interface Props {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function MettloEmptyState({ icon = '🔍', title, description, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.container}>
      <MettloText style={styles.icon}>{icon}</MettloText>
      <MettloText variant="h4" style={styles.title}>{title}</MettloText>
      {description && <MettloText variant="body" color={Colors.textMuted} style={styles.desc}>{description}</MettloText>}
      {ctaLabel && onCta && (
        <MettloButton label={ctaLabel} onPress={onCta} variant="outline" style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space.s32, gap: Space.s12 },
  icon: { fontSize: 48, marginBottom: Space.s8 },
  title: { textAlign: 'center' },
  desc: { textAlign: 'center' },
  cta: { marginTop: Space.s8 },
});
