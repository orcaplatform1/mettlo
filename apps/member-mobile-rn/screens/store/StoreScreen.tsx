import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloEmptyState } from '../../components/ui/MettloEmptyState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { storeService } from '../../services/storeService';

export function StoreScreen() {
  const [category, setCategory] = useState('');

  const { data: cats } = useQuery({
    queryKey: ['store-categories'],
    queryFn: () => storeService.categories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['store-products', category],
    queryFn: () => storeService.products({ category: category || undefined }),
  });

  const products = data?.items ?? data?.products ?? [];
  const categories = cats?.items ?? cats?.categories ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Hero banner */}
      <LinearGradient colors={['rgba(249,115,22,0.12)', 'transparent']} style={styles.heroBanner}>
        <MettloText variant="h2">Mettlo Mağaza</MettloText>
        <MettloText variant="body" color={Colors.textMuted}>Spor giyim, takviye & ekipman</MettloText>
      </LinearGradient>

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {[{ id: '', name: 'Tümü' }, ...categories].map((c: any) => (
            <Pressable key={c.id} onPress={() => setCategory(c.id)}
              style={[styles.catChip, category === c.id && styles.catChipActive]}>
              <MettloText variant="caption" color={category === c.id ? '#fff' : Colors.textMuted} style={category === c.id ? { fontWeight: '700' } : undefined}>{c.name}</MettloText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {isLoading ? <MettloLoadingState /> : products.length === 0 ? (
        <MettloEmptyState icon="🛍️" title="Ürün bulunamadı" description="Mağaza yakında daha fazla ürünle genişleyecek." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p: any) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <Pressable style={({ pressed }) => [styles.productCard, { opacity: pressed ? 0.88 : 1 }]}>
              <View style={styles.productImage}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <LinearGradient colors={[Colors.surface2, Colors.surface3]} style={StyleSheet.absoluteFill} />
                )}
              </View>
              <View style={styles.productBody}>
                <MettloText variant="bodySm" numberOfLines={2}>{item.title}</MettloText>
                <MettloText variant="h5" color={Colors.primary}>{item.price}</MettloText>
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
  heroBanner: { paddingHorizontal: Space.s16, paddingVertical: Space.s16, gap: Space.s4 },
  catScroll: { flexGrow: 0 },
  catContent: { paddingHorizontal: Space.s16, paddingBottom: Space.s8, gap: Space.s8 },
  catChip: { paddingHorizontal: Space.s14, paddingVertical: Space.s8, backgroundColor: Colors.surface2, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  list: { padding: Space.s16, gap: Space.s12 },
  row: { gap: Space.s12 },
  productCard: { flex: 1, backgroundColor: Colors.surface1, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderSubtle },
  productImage: { height: 140 },
  productBody: { padding: Space.s10, gap: Space.s6 },
});
