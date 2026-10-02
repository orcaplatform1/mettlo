import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Space, Typography } from '../../constants/tokens';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function MettloInput({ label, error, rightIcon, isPassword, style, ...props }: Props) {
  const [secure, setSecure] = useState(isPassword ?? false);
  const [focused, setFocused] = useState(false);

  const gradientColors: [string, string] = error
    ? [Colors.error, Colors.error]
    : focused
    ? ['#F97316', '#EC4899']
    : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)'];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, style as object]}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={secure}
            autoCapitalize="none"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {isPassword && (
            <Pressable onPress={() => setSecure((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
              <Text style={styles.eyeText}>{secure ? '👁' : '🙈'}</Text>
            </Pressable>
          )}
          {!isPassword && rightIcon}
        </View>
      </LinearGradient>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Space.s6 },
  label: { ...Typography.bodySm, color: Colors.textSecondary, fontWeight: '500' },
  gradientBorder: {
    borderRadius: Radius.md + 1,
    padding: 1.5,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    paddingHorizontal: Space.s16, height: 50,
  },
  input: {
    flex: 1, color: Colors.textPrimary,
    fontSize: 15, lineHeight: 23,
  },
  eyeBtn: { padding: Space.s4 },
  eyeText: { fontSize: 18 },
  errorText: { ...Typography.caption, color: Colors.error },
});
