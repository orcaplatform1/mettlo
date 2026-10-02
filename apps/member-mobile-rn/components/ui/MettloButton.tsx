import React from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle, type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Space, Typography } from '../../constants/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  onPress?: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const sizes: Record<Size, { height: number; px: number; fontSize: number }> = {
  sm: { height: 36, px: Space.s12, fontSize: 13 },
  md: { height: 46, px: Space.s20, fontSize: 15 },
  lg: { height: 54, px: Space.s28, fontSize: 16 },
};

export function MettloButton({
  onPress, label, variant = 'primary', size = 'md',
  loading, disabled, fullWidth, style, textStyle,
}: Props) {
  const s = sizes[size];
  const isDisabled = disabled || loading;

  const inner = (
    <Text style={[{ fontSize: s.fontSize, fontWeight: '700', letterSpacing: 0.3 }, getTextColor(variant), textStyle]}>
      {loading ? <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#fff'} /> : label}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={!isDisabled ? onPress : undefined}
        style={({ pressed }) => [
          { borderRadius: Radius.md, height: s.height, overflow: 'hidden', opacity: pressed || isDisabled ? 0.7 : 1 },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <LinearGradient
          colors={['#F97316', '#FB7185', '#EC4899']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: s.px }]}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        { height: s.height, paddingHorizontal: s.px, borderRadius: Radius.md },
        getContainerStyle(variant),
        fullWidth && { width: '100%' },
        { opacity: pressed || isDisabled ? 0.7 : 1 },
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}

function getContainerStyle(variant: Variant): ViewStyle {
  switch (variant) {
    case 'secondary': return { backgroundColor: Colors.surface2 };
    case 'outline': return { borderWidth: 1, borderColor: Colors.primary, backgroundColor: 'transparent' };
    case 'ghost': return { backgroundColor: 'transparent' };
    case 'danger': return { backgroundColor: Colors.error };
    default: return {};
  }
}

function getTextColor(variant: Variant): TextStyle {
  switch (variant) {
    case 'outline': return { color: Colors.primary };
    case 'ghost': return { color: Colors.textPrimary };
    case 'danger': return { color: '#fff' };
    default: return { color: '#fff' };
  }
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
