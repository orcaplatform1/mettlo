import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MettloText } from './MettloText';
import { Colors, Space } from '../../constants/tokens';

interface Props {
  title: string;
  subtitle?: string;
  cta?: string;
  onCta?: () => void;
}

export function MettloSectionHeader({ title, subtitle, cta, onCta }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {subtitle && <MettloText variant="label" color={Colors.primary} style={styles.sub}>{subtitle.toUpperCase()}</MettloText>}
        <MettloText variant="h3">{title}</MettloText>
      </View>
      {cta && onCta && (
        <Pressable onPress={onCta} hitSlop={8}>
          <MettloText variant="bodySm" color={Colors.primary}>{cta}</MettloText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Space.s16 },
  left: { gap: Space.s4, flex: 1 },
  sub: { letterSpacing: 1 },
});
