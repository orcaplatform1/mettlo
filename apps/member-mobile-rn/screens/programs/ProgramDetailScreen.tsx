import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { MettloErrorState } from '../../components/ui/MettloErrorState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { programService } from '../../services/programService';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'ProgramDetail'>;

export function ProgramDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { slug } = route.params;

  const qc = useQueryClient();
  const purchaseMut = useMutation({
    mutationFn: () => programService.purchase(slug),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['program', slug] }); Alert.alert('Başarılı!', 'Programa kaydoldun.'); },
    onError: (e: any) => Alert.alert('Hata', e?.response?.data?.message ?? 'Satın alma sırasında bir sorun oluştu.'),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['program', slug],
    queryFn: () => programService.get(slug),
  });

  if (isLoading) return <MettloLoadingState />;
  if (isError || !data) return <MettloErrorState onRetry={refetch} />;

  const p = data.program ?? data;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.cover}>
          {p.coverUrl ? (
            <Image source={{ uri: p.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#0D0B1F', '#110928']} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient colors={['transparent', Colors.bg]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <MettloText color={Colors.textPrimary}>← Geri</MettloText>
          </Pressable>
        </View>

        <View style={styles.body}>
          {p.branch && <MettloBadge label={p.branch} variant="gradient" />}
          <MettloText variant="h2">{p.title}</MettloText>

          {p.coachName && (
            <MettloText variant="body" color={Colors.textSecondary}>
              👨‍💼 {p.coachName}
            </MettloText>
          )}

          <View style={styles.tags}>
            {p.durationDays && <MettloBadge label={`${p.durationDays} Gün`} variant="surface" />}
            {p.level && <MettloBadge label={p.level} variant="surface" />}
            {p.lessonCount && <MettloBadge label={`${p.lessonCount} Ders`} variant="surface" />}
          </View>

          {p.description && (
            <View style={styles.descBox}>
              <MettloText variant="h5">Hakkında</MettloText>
              <MettloText variant="body" color={Colors.textSecondary}>{p.description}</MettloText>
            </View>
          )}

          {p.goals && p.goals.length > 0 && (
            <View style={styles.goalsBox}>
              <MettloText variant="h5">Hedefler</MettloText>
              {p.goals.map((g: string, i: number) => (
                <View key={i} style={styles.goalRow}>
                  <MettloText color={Colors.primary}>✓</MettloText>
                  <MettloText variant="body" color={Colors.textSecondary}>{g}</MettloText>
                </View>
              ))}
            </View>
          )}

          {p.lessons && p.lessons.length > 0 && (
            <View style={styles.lessonsBox}>
              <MettloText variant="h5">Dersler ({p.lessons.length})</MettloText>
              {p.lessons.slice(0, 5).map((l: any, i: number) => (
                <View key={i} style={styles.lessonRow}>
                  <MettloText variant="caption" color={Colors.textMuted} style={styles.lessonNum}>{i + 1}</MettloText>
                  <MettloText variant="body">{l.title}</MettloText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <View>
          <MettloText variant="caption" color={Colors.textMuted}>Fiyat</MettloText>
          <MettloText variant="h4" color={Colors.primary}>{p.price ?? 'Ücretsiz'}</MettloText>
        </View>
        <MettloButton
          label={p.isPurchased ? 'Devam Et' : 'Satın Al'}
          onPress={() => purchaseMut.mutate()}
          loading={purchaseMut.isPending}
          size="lg"
          style={{ flex: 1, marginLeft: Space.s16 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  cover: { height: 260, position: 'relative' },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  body: { padding: Space.s20, gap: Space.s16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8 },
  descBox: { gap: Space.s8 },
  goalsBox: { gap: Space.s10 },
  goalRow: { flexDirection: 'row', gap: Space.s10, alignItems: 'flex-start' },
  lessonsBox: { gap: Space.s10 },
  lessonRow: { flexDirection: 'row', gap: Space.s12, alignItems: 'center', paddingVertical: Space.s8, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  lessonNum: { width: 24, fontWeight: '700' },
  ctaBar: { flexDirection: 'row', alignItems: 'center', padding: Space.s16, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, backgroundColor: Colors.surface1 },
});
