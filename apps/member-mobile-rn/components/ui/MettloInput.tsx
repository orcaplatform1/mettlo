import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { Colors, Radius, Space, Typography } from '../../constants/tokens';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function MettloInput({ label, error, rightIcon, isPassword, style, ...props }: Props) {
  const [secure, setSecure] = useState(isPassword ?? false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          style={[styles.input, style as object]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secure}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setSecure((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
            <Text style={styles.eyeText}>{secure ? '👁' : '🙈'}</Text>
          </Pressable>
        )}
        {!isPassword && rightIcon}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Space.s6 },
  label: { ...Typography.bodySm, color: Colors.textSecondary, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    paddingHorizontal: Space.s16, height: 50,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1, color: Colors.textPrimary,
    fontSize: 15, lineHeight: 23,
  },
  eyeBtn: { padding: Space.s4 },
  eyeText: { fontSize: 18 },
  errorText: { ...Typography.caption, color: Colors.error },
});
