import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Space } from '../../constants/tokens';

export function FavoritesScreen() {
  const nav = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </Pressable>
        <MettloText variant="h2">Favorilerim</MettloText>
      </View>
      <MettloEmptyState icon="❤️" title="Henüz favorin yok" description="Koç, program veya içerik favorilediğinde burada görünür." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s12, gap: Space.s8 },
});
