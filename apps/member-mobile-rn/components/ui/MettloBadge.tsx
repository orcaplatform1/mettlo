import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Typography } from '../../constants/tokens';

type BadgeVariant = 'primary' | 'gradient' | 'surface' | 'success' | 'error' | 'warning' | 'verified';

interface Props {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function MettloBadge({ label, variant = 'surface', style }: Props) {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['#F97316', '#FB7185', '#EC4899']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.badge, { borderRadius: Radius.pill }, style]}
      >
        <Text style={styles.text}>{label}</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.badge, getStyle(variant), style]}>
      <Text style={[styles.text, getTextStyle(variant)]}>{label}</Text>
    </View>
  );
}

function getStyle(v: BadgeVariant): ViewStyle {
  switch (v) {
    case 'primary': return { backgroundColor: Colors.primary, borderRadius: Radius.pill };
    case 'surface': return { backgroundColor: Colors.surface2, borderRadius: Radius.pill };
    case 'success': return { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' };
    case 'error': return { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: Radius.pill };
    case 'warning': return { backgroundColor: 'rgba(253,224,71,0.15)', borderRadius: Radius.pill };
    case 'verified': return { backgroundColor: Colors.verified, borderRadius: Radius.pill };
    default: return {};
  }
}

function getTextStyle(v: BadgeVariant) {
  if (v === 'success') return { color: Colors.success };
  if (v === 'error') return { color: Colors.error };
  if (v === 'warning') return { color: Colors.warning };
  return {};
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { ...Typography.caption, fontWeight: '600', color: Colors.textPrimary },
});
