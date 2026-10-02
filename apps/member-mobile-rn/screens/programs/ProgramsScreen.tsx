import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloProgramCard } from '../../components/cards/MettloProgramCard';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { programService } from '../../services/programService';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DURATIONS = [
  { label: 'Tümü', value: undefined },
  { label: '7 Gün', value: 7 },
  { label: '14 Gün', value: 14 },
  { label: '30 Gün', value: 30 },
  { label: '60 Gün', value: 60 },
  { label: '90 Gün', value: 90 },
];

const LEVELS = [
  { label: 'Tümü', value: undefined },
  { label: 'Başlangıç', value: 'beginner' },
  { label: 'Orta', value: 'intermediate' },
  { label: 'İleri', value: 'advanced' },
];

export function ProgramsScreen() {
  const nav = useNavigation<Nav>();
  const [duration, setDuration] = useState<number | undefined>();
  const [level, setLevel] = useState<string | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['programs', duration, level],
    queryFn: () => programService.list({ duration, level }),
  });

  const programs = data?.items ?? data?.programs ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MettloText variant="h2">Programlar</MettloText>
        <MettloText variant="body" color={Colors.textMuted}>Hedefine uygun programı seç</MettloText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {DURATIONS.map((d) => (
          <Pressable key={String(d.value)} onPress={() => setDuration(d.value)}
            style={[styles.filterChip, duration === d.value && styles.filterChipActive]}>
            <MettloText variant="caption" color={duration === d.value ? '#fff' : Colors.textMuted}
              style={duration === d.value ? { fontWeight: '700' } : undefined}>{d.label}</MettloText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {LEVELS.map((l) => (
          <Pressable key={String(l.value)} onPress={() => setLevel(l.value)}
            style={[styles.filterChip, level === l.value && styles.filterChipActive]}>
            <MettloText variant="caption" color={level === l.value ? '#fff' : Colors.textMuted}
              style={level === l.value ? { fontWeight: '700' } : undefined}>{l.label}</MettloText>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <MettloLoadingState />
      ) : programs.length === 0 ? (
        <MettloEmptyState icon="📋" title="Program bulunamadı" description="Farklı filtreler dene." ctaLabel="Filtreleri Temizle" onCta={() => { setDuration(undefined); setLevel(undefined); }} />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(p: any) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cardWrap}>
              <MettloProgramCard
                program={item}
                onPress={() => nav.navigate('ProgramDetail', { slug: item.slug })}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s4, gap: Space.s4 },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: Space.s16, paddingVertical: Space.s8, gap: Space.s8 },
  filterChip: {
    paddingHorizontal: Space.s14, paddingVertical: Space.s8,
    backgroundColor: Colors.surface2, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  list: { padding: Space.s16, gap: Space.s12 },
  row: { gap: Space.s12 },
  cardWrap: { flex: 1 },
});
