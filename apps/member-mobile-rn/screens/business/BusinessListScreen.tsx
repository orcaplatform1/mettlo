import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { businessService } from '../../services/businessService';
import type { RootStackParamList } from '../../navigation';

const CATEGORY_TR: Record<string, string> = {
  FITNESS_GYM: 'Fitness & Spor Salonu',
  YOGA_STUDIO: 'Yoga Stüdyosu',
  PILATES_STUDIO: 'Pilates Stüdyosu',
  MARTIAL_ARTS: 'Dövüş Sanatları',
  SWIMMING_POOL: 'Yüzme Havuzu',
  SPORTS_CLUB: 'Spor Kulübü',
  HEALTHY_FOOD: 'Sağlıklı Yiyecek',
  SUPPLEMENT_STORE: 'Takviye Mağazası',
  SPORTS_EQUIPMENT: 'Spor Ekipmanları',
  WELLNESS_CENTER: 'Wellness Merkezi',
  PHYSIOTHERAPY: 'Fizyoterapi',
  OUTDOOR_SPORTS: 'Açık Hava Sporları',
  RUNNING_CLUB: 'Koşu Kulübü',
  CYCLING: 'Bisiklet',
  CROSSFIT: 'CrossFit',
  OTHER: 'Diğer',
};

type Route = RouteProp<RootStackParamList, 'BusinessList'>;

export function BusinessListScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const [search, setSearch] = useState('');
  const initCat = route.params?.category ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', initCat],
    queryFn: () => businessService.list({ category: initCat || undefined }),
  });

  const businesses = data?.items ?? data?.businesses ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </Pressable>
        <MettloText variant="h2">İşletmeler</MettloText>
        <View style={styles.searchBar}>
          <MettloText color={Colors.textMuted}>🔍</MettloText>
          <TextInput
            style={styles.searchInput}
            placeholder="İşletme ara..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? <MettloLoadingState /> : businesses.length === 0 ? (
        <MettloEmptyState icon="🏢" title="İşletme bulunamadı" />
      ) : (
        <FlatList
          data={businesses.filter((b: any) => !search || b.name?.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={(b: any) => b.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <Pressable style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => (nav as any).navigate('BusinessDetail', { slug: item.slug })}>
              <View style={styles.cardImg}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <MettloText style={styles.fallbackIcon}>🏢</MettloText>
                )}
              </View>
              <View style={styles.cardBody}>
                <MettloText variant="h5">{item.name}</MettloText>
                <MettloText variant="caption" color={Colors.primary}>{CATEGORY_TR[item.category] ?? item.category}</MettloText>
                {item.district && <MettloText variant="caption" color={Colors.textMuted}>📍 {item.district}</MettloText>}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s8, gap: Space.s12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 46, gap: Space.s10, borderWidth: 1, borderColor: Colors.borderSubtle },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  list: { padding: Space.s16, gap: Space.s12 },
  card: { flexDirection: 'row', backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, overflow: 'hidden' },
  cardImg: { width: 80, height: 80, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  fallbackIcon: { fontSize: 32 },
  cardBody: { flex: 1, padding: Space.s12, gap: Space.s4 },
});
