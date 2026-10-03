import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloRecipeCard } from '../../components/cards/MettloRecipeCard';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { recipeService } from '../../services/recipeService';

export function NutritionScreen() {
  const nav = useNavigation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['recipe-categories'],
    queryFn: () => recipeService.categories(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recipes', category, search],
    queryFn: () => recipeService.list({ category: category || undefined, search: search || undefined }),
  });

  const recipes = data?.items ?? data?.recipes ?? [];
  const cats = categories?.items ?? categories?.categories ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MettloText variant="h2">Sağlıklı Beslenme</MettloText>
        <MettloText variant="body" color={Colors.textMuted}>~1.000 tarif, tamamen ücretsiz</MettloText>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <MettloText color={Colors.textMuted} style={styles.searchIcon}>🔍</MettloText>
          <TextInput
            style={styles.searchInput}
            placeholder="Tarif ara..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {cats.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {[{ id: '', name: 'Tümü' }, ...cats].map((c: any) => (
            <View key={c.id} style={[styles.catChip, category === c.id && styles.catChipActive]}>
              <MettloText variant="caption" color={category === c.id ? '#fff' : Colors.textMuted} onPress={() => setCategory(c.id)} style={category === c.id ? { fontWeight: '700' } : undefined}>{c.name}</MettloText>
            </View>
          ))}
        </ScrollView>
      )}

      {isLoading ? <MettloLoadingState /> : recipes.length === 0 ? (
        <MettloEmptyState icon="🥗" title="Tarif bulunamadı" ctaLabel="Aramayı Temizle" onCta={() => { setSearch(''); setCategory(''); }} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r: any) => r.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cardWrap}>
              <MettloRecipeCard recipe={item} onPress={() => (nav as any).navigate('RecipeDetail', { slug: item.slug })} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s8, gap: Space.s4 },
  searchWrap: { paddingHorizontal: Space.s16, paddingBottom: Space.s8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 46, gap: Space.s10, borderWidth: 1, borderColor: Colors.borderSubtle },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  catScroll: { flexGrow: 0 },
  catContent: { paddingHorizontal: Space.s16, paddingBottom: Space.s8, gap: Space.s8 },
  catChip: { paddingHorizontal: Space.s14, paddingVertical: Space.s8, backgroundColor: Colors.surface2, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  list: { padding: Space.s16, gap: Space.s12 },
  row: { gap: Space.s12 },
  cardWrap: { flex: 1 },
});
