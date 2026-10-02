import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloChallengeCard } from '../../components/cards/MettloChallengeCard';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { challengeService } from '../../services/challengeService';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const TABS = ['active', 'upcoming', 'completed'] as const;
const TAB_LABELS: Record<string, string> = { active: 'Aktif', upcoming: 'Yakında', completed: 'Tamamlanan' };

export function ChallengesScreen() {
  const nav = useNavigation<Nav>();
  const [status, setStatus] = useState<'active' | 'upcoming' | 'completed'>('active');

  const { data, isLoading } = useQuery({
    queryKey: ['challenges', status],
    queryFn: () => challengeService.list({ status }),
  });

  const challenges = data?.items ?? data?.challenges ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MettloText variant="h2">Challenge'lar</MettloText>
        <MettloText variant="body" color={Colors.textMuted}>Katıl, tamamla, kazan</MettloText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setStatus(t)}
            style={[styles.tab, status === t && styles.tabActive]}>
            <MettloText variant="caption" color={status === t ? '#fff' : Colors.textMuted} style={status === t ? { fontWeight: '700' } : undefined}>{TAB_LABELS[t]}</MettloText>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? <MettloLoadingState /> : challenges.length === 0 ? (
        <MettloEmptyState icon="🏆" title="Henüz challenge yok" description="Yaklaşan challenge'lar burada görünür." />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(c: any) => c.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cardWrap}>
              <MettloChallengeCard challenge={item} onPress={() => nav.navigate('ChallengeDetail', { slug: item.slug })} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s4, gap: Space.s4 },
  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: Space.s16, paddingVertical: Space.s8, gap: Space.s8 },
  tab: { paddingHorizontal: Space.s16, paddingVertical: Space.s8, backgroundColor: Colors.surface2, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  list: { padding: Space.s16, gap: Space.s12 },
  row: { gap: Space.s12 },
  cardWrap: { flex: 1 },
});
