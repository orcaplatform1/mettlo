import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from '../ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';

export interface RecipeCardData {
  id: string; slug: string; title: string; imageUrl?: string;
  calories?: number; protein?: number; prepMinutes?: number;
  category?: string; isFavorite?: boolean;
}

interface Props { recipe: RecipeCardData; onPress: () => void }

export function MettloRecipeCard({ recipe, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}>
      <View style={styles.cover}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={['#1F2937', '#111827']} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: Space.s8 }]}>
          {recipe.prepMinutes && (
            <View style={styles.timeBadge}>
              <MettloText variant="caption" style={styles.timeText}>⏱ {recipe.prepMinutes} dk</MettloText>
            </View>
          )}
        </LinearGradient>
      </View>
      <View style={styles.body}>
        {recipe.category && <MettloText variant="caption" color={Colors.primary}>{recipe.category}</MettloText>}
        <MettloText variant="h5" numberOfLines={2}>{recipe.title}</MettloText>
        <View style={styles.macros}>
          {recipe.calories != null && <MettloText variant="caption" color={Colors.textMuted}>{recipe.calories} kcal</MettloText>}
          {recipe.protein != null && <MettloText variant="caption" color={Colors.textMuted}>{recipe.protein}g protein</MettloText>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface1, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    overflow: 'hidden', width: 180,
  },
  cover: { height: 120, backgroundColor: Colors.surface2 },
  body: { padding: Space.s10, gap: Space.s4 },
  macros: { flexDirection: 'row', gap: Space.s8 },
  timeBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.sm,
    paddingHorizontal: Space.s6, paddingVertical: 2, alignSelf: 'flex-start',
  },
  timeText: { color: '#fff' },
});
