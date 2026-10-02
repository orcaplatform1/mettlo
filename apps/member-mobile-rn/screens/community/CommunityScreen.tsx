import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { communityService } from '../../services/communityService';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CommunityScreen() {
  const nav = useNavigation<Nav>();

  const { data, isLoading } = useQuery({
    queryKey: ['community'],
    queryFn: () => communityService.list(),
  });

  const communities = data?.items ?? data?.communities ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MettloText variant="h2">Topluluk</MettloText>
        <MettloText variant="body" color={Colors.textMuted}>Benzer hedeflere sahip kişilerle bağlan</MettloText>
      </View>

      {isLoading ? <MettloLoadingState /> : communities.length === 0 ? (
        <MettloEmptyState icon="👥" title="Topluluk bulunamadı" />
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(c: any) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => nav.navigate('CommunityDetail', { slug: item.slug })}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, { backgroundColor: item.color ?? Colors.surface3 }]}>
                  <MettloText style={styles.icon}>{item.emoji ?? '👥'}</MettloText>
                </View>
              </View>
              <View style={styles.cardRight}>
                <MettloText variant="h5">{item.name}</MettloText>
                <MettloText variant="bodySm" color={Colors.textMuted} numberOfLines={2}>{item.description}</MettloText>
                <View style={styles.memberRow}>
                  <MettloText variant="caption" color={Colors.textMuted}>👥 {item.memberCount ?? 0} üye</MettloText>
                  {item.isJoined && <MettloText variant="caption" color={Colors.success}>Üyesin ✓</MettloText>}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s12, gap: Space.s4 },
  list: { padding: Space.s16, gap: Space.s12 },
  card: { flexDirection: 'row', backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14, gap: Space.s14 },
  cardLeft: {},
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28 },
  cardRight: { flex: 1, gap: Space.s4 },
  memberRow: { flexDirection: 'row', gap: Space.s12, marginTop: Space.s4 },
});
