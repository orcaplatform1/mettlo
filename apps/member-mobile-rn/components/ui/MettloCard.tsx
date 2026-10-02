import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '../../constants/tokens';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'border';
  padding?: number;
}

export function MettloCard({ children, onPress, style, variant = 'default', padding = 16 }: Props) {
  const content = (
    <View style={[styles.card, getVariantStyle(variant), { padding }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

function getVariantStyle(v: Props['variant']): ViewStyle {
  switch (v) {
    case 'elevated': return { ...Shadow.md, backgroundColor: Colors.surface1 };
    case 'border': return { borderWidth: 1, borderColor: Colors.borderSubtle, backgroundColor: Colors.surface1 };
    default: return { backgroundColor: Colors.surface1 };
  }
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card, overflow: 'hidden' },
});
