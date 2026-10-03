import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { recipeService } from '../../services/recipeService';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { slug } = route.params;

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', slug],
    queryFn: () => recipeService.get(slug),
  });

  if (isLoading) return <MettloLoadingState />;
  if (!recipe) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {recipe.imageUrl && (
          <View style={styles.imgWrap}>
            <Image source={{ uri: recipe.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Pressable style={styles.backBtn} onPress={() => nav.goBack()} hitSlop={12}>
              <MettloText style={styles.backText}>← Geri</MettloText>
            </Pressable>
          </View>
        )}

        <View style={styles.body}>
          {!recipe.imageUrl && (
            <Pressable onPress={() => nav.goBack()} hitSlop={12} style={{ marginBottom: Space.s8 }}>
              <MettloText color={Colors.textMuted}>← Geri</MettloText>
            </Pressable>
          )}

          <MettloText variant="h2">{recipe.title ?? recipe.name}</MettloText>
          {recipe.category && <MettloText variant="caption" color={Colors.primary} style={{ marginTop: Space.s4 }}>{recipe.category}</MettloText>}

          {/* Makro */}
          {(recipe.kcal || recipe.protein || recipe.carbs || recipe.fat) && (
            <View style={styles.macroRow}>
              {recipe.kcal && <View style={styles.macro}><MettloText variant="h5">{recipe.kcal}</MettloText><MettloText variant="caption" color={Colors.textMuted}>kcal</MettloText></View>}
              {recipe.protein && <View style={styles.macro}><MettloText variant="h5">{recipe.protein}g</MettloText><MettloText variant="caption" color={Colors.textMuted}>protein</MettloText></View>}
              {recipe.carbs && <View style={styles.macro}><MettloText variant="h5">{recipe.carbs}g</MettloText><MettloText variant="caption" color={Colors.textMuted}>karbonhidrat</MettloText></View>}
              {recipe.fat && <View style={styles.macro}><MettloText variant="h5">{recipe.fat}g</MettloText><MettloText variant="caption" color={Colors.textMuted}>yağ</MettloText></View>}
            </View>
          )}

          {recipe.description && (
            <View style={styles.section}>
              <MettloText color={Colors.textSecondary}>{recipe.description}</MettloText>
            </View>
          )}

          {recipe.ingredients?.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>Malzemeler</MettloText>
              {recipe.ingredients.map((ing: any, i: number) => (
                <MettloText key={i} color={Colors.textSecondary} style={styles.listItem}>• {ing.name ?? ing} {ing.amount ? `— ${ing.amount}` : ''}</MettloText>
              ))}
            </View>
          )}

          {recipe.steps?.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>Hazırlanışı</MettloText>
              {recipe.steps.map((step: any, i: number) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}><MettloText style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{i + 1}</MettloText></View>
                  <MettloText color={Colors.textSecondary} style={{ flex: 1 }}>{step.description ?? step}</MettloText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  imgWrap: { height: 220, position: 'relative' },
  backBtn: { position: 'absolute', top: Space.s16, left: Space.s16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.md, paddingHorizontal: Space.s12, paddingVertical: Space.s6 },
  backText: { color: '#fff' },
  body: { padding: Space.s16, paddingBottom: Space.s40 },
  macroRow: { flexDirection: 'row', gap: Space.s12, marginTop: Space.s16, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14 },
  macro: { flex: 1, alignItems: 'center' },
  section: { marginTop: Space.s24 },
  sectionTitle: { marginBottom: Space.s12 },
  listItem: { marginBottom: Space.s6 },
  step: { flexDirection: 'row', gap: Space.s12, marginBottom: Space.s12, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
