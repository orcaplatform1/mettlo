import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MettloButton } from './MettloButton';
import { MettloText } from './MettloText';
import { Colors, Space } from '../../constants/tokens';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function MettloErrorState({ message = 'Bir hata oluştu.', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <MettloText style={styles.icon}>⚠️</MettloText>
      <MettloText variant="h5" style={styles.center}>Hata</MettloText>
      <MettloText variant="body" color={Colors.textMuted} style={styles.center}>{message}</MettloText>
      {onRetry && <MettloButton label="Tekrar Dene" onPress={onRetry} variant="outline" style={styles.btn} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space.s32, gap: Space.s12 },
  icon: { fontSize: 40 },
  center: { textAlign: 'center' },
  btn: { marginTop: Space.s8 },
});
