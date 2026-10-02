import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLiveCard } from '../../components/cards/MettloLiveCard';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { liveService } from '../../services/liveService';

const TABS = [
  { id: 'upcoming', label: 'Yaklaşan' },
  { id: 'live', label: '🔴 Canlı' },
  { id: 'past', label: 'Geçmiş' },
];

export function LiveScreen() {
  const [tab, setTab] = useState('upcoming');

  const { data, isLoading } = useQuery({
    queryKey: ['live', tab],
    queryFn: () => liveService.list({ upcoming: tab === 'upcoming' }),
  });

  const sessions = data?.items ?? data?.sessions ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MettloText variant="h2">Canlı Dersler</MettloText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}>
            <MettloText variant="caption" color={tab === t.id ? '#fff' : Colors.textMuted}
              style={tab === t.id ? { fontWeight: '700' } : undefined}>{t.label}</MettloText>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? <MettloLoadingState /> : sessions.length === 0 ? (
        <MettloEmptyState icon="📡" title="Henüz ders yok" description="Yaklaşan canlı dersler burada görünür." />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s: any) => s.id}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cardWrap}>
              <MettloLiveCard session={item} onPress={() => {/* TODO: live join */}} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s8 },
  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: Space.s16, paddingVertical: Space.s8, gap: Space.s8 },
  tab: { paddingHorizontal: Space.s16, paddingVertical: Space.s8, backgroundColor: Colors.surface2, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  list: { padding: Space.s16, gap: Space.s12 },
  cardWrap: { width: '100%' },
});
