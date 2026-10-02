import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloCoachCard } from '../../components/cards/MettloCoachCard';
import { MettloProgramCard } from '../../components/cards/MettloProgramCard';
import { MettloSectionHeader } from '../../components/ui/MettloSectionHeader';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { coachService } from '../../services/coachService';
import { programService } from '../../services/programService';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BRANCHES = [
  { id: '', label: 'Tümü' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'yoga-mobility', label: 'Yoga' },
  { id: 'pilates-core', label: 'Pilates' },
  { id: 'hiit-cardio', label: 'HIIT' },
  { id: 'nutrition', label: 'Beslenme' },
  { id: 'meditation', label: 'Meditasyon' },
  { id: 'running', label: 'Koşu' },
  { id: 'boxing', label: 'Boks' },
  { id: 'dance', label: 'Dans' },
];

export function ExploreScreen() {
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');

  const { data: coaches, isLoading: coachLoading } = useQuery({
    queryKey: ['coaches', branch, search],
    queryFn: () => coachService.list({ branch: branch || undefined, search: search || undefined }),
  });

  const { data: programs, isLoading: progLoading } = useQuery({
    queryKey: ['programs', branch],
    queryFn: () => programService.list({ branch: branch || undefined }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MettloText variant="h2">Keşfet</MettloText>
          <View style={styles.searchBar}>
            <MettloText color={Colors.textMuted} style={styles.searchIcon}>🔍</MettloText>
            <TextInput
              style={styles.searchInput}
              placeholder="Koç, program, branş ara..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Branş filtreleri */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll} contentContainerStyle={styles.branchContent}>
          {BRANCHES.map((b) => (
            <View
              key={b.id}
              style={[styles.branchChip, branch === b.id && styles.branchChipActive]}
              // @ts-ignore — Pressable yerine View: touch handled by parent FlatList
            >
              <MettloText
                variant="caption"
                color={branch === b.id ? Colors.textPrimary : Colors.textMuted}
                style={[styles.branchLabel, branch === b.id && styles.branchLabelActive]}
                onPress={() => setBranch(b.id)}
              >
                {b.label}
              </MettloText>
            </View>
          ))}
        </ScrollView>

        {/* Koçlar */}
        <View style={styles.section}>
          <MettloSectionHeader title="Koçlar" subtitle="Uzmanlar" cta="Tümünü Gör" onCta={() => {}} />
          {coachLoading ? (
            <MettloLoadingState />
          ) : (
            <FlatList
              horizontal
              data={(coaches?.items ?? coaches?.coaches ?? []).slice(0, 10)}
              keyExtractor={(c: any) => c.id}
              renderItem={({ item }: { item: any }) => (
                <MettloCoachCard
                  coach={item}
                  onPress={() => nav.navigate('CoachDetail', { username: item.username })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: Space.s12 }} />}
              contentContainerStyle={{ paddingRight: Space.s16 }}
              scrollEnabled
            />
          )}
        </View>

        {/* Programlar */}
        <View style={styles.section}>
          <MettloSectionHeader title="Programlar" subtitle="İçerikler" cta="Tümünü Gör" onCta={() => nav.navigate('Programs')} />
          {progLoading ? (
            <MettloLoadingState />
          ) : (
            <FlatList
              horizontal
              data={(programs?.items ?? programs?.programs ?? []).slice(0, 10)}
              keyExtractor={(p: any) => p.id}
              renderItem={({ item }: { item: any }) => (
                <MettloProgramCard
                  program={item}
                  onPress={() => nav.navigate('ProgramDetail', { slug: item.slug })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: Space.s12 }} />}
              contentContainerStyle={{ paddingRight: Space.s16 }}
              scrollEnabled
            />
          )}
        </View>

        <View style={{ height: Space.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s12, gap: Space.s16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    paddingHorizontal: Space.s14, height: 46, gap: Space.s10,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  branchScroll: { paddingVertical: Space.s8 },
  branchContent: { paddingHorizontal: Space.s16, gap: Space.s8 },
  branchChip: {
    paddingHorizontal: Space.s14, paddingVertical: Space.s8,
    backgroundColor: Colors.surface2, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  branchChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  branchLabel: {},
  branchLabelActive: { fontWeight: '700' },
  section: { paddingHorizontal: Space.s16, paddingVertical: Space.s16, gap: Space.s12 },
});
