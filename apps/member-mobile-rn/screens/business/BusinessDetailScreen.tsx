import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { Colors, Radius, Space } from '../../constants/tokens';
import { businessService } from '../../services/businessService';
import type { RootStackParamList } from '../../navigation';

type Route = RouteProp<RootStackParamList, 'BusinessDetail'>;

const CATEGORY_TR: Record<string, string> = {
  FITNESS_GYM: 'Fitness & Spor Salonu', YOGA_STUDIO: 'Yoga Stüdyosu',
  PILATES_STUDIO: 'Pilates Stüdyosu', MARTIAL_ARTS: 'Dövüş Sanatları',
  SWIMMING_POOL: 'Yüzme Havuzu', SPORTS_CLUB: 'Spor Kulübü',
  HEALTHY_FOOD: 'Sağlıklı Yiyecek', SUPPLEMENT_STORE: 'Takviye Mağazası',
  SPORTS_EQUIPMENT: 'Spor Ekipmanları', WELLNESS_CENTER: 'Wellness Merkezi',
  PHYSIOTHERAPY: 'Fizyoterapi', OUTDOOR_SPORTS: 'Açık Hava Sporları',
  RUNNING_CLUB: 'Koşu Kulübü', CYCLING: 'Bisiklet', CROSSFIT: 'CrossFit', OTHER: 'Diğer',
};

export function BusinessDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { slug } = route.params;

  const { data: biz, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => businessService.get(slug),
  });

  if (isLoading) return <MettloLoadingState />;
  if (!biz) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          {biz.coverUrl ? (
            <Image source={{ uri: biz.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface2 }]} />
          )}
          <Pressable style={styles.backBtn} onPress={() => nav.goBack()} hitSlop={12}>
            <MettloText style={styles.backText}>← Geri</MettloText>
          </Pressable>
          {biz.logoUrl && (
            <View style={[styles.logoWrap, { overflow: 'visible' }]}>
              <Image source={{ uri: biz.logoUrl }} style={[styles.logo, { borderRadius: Radius.md }]} contentFit="cover" />
              {biz.verificationStatus === 'VERIFIED' && (
                <VerifiedBadge size={22} style={{ position: 'absolute', bottom: -4, right: -4 }} />
              )}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Başlık */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <MettloText variant="h2">{biz.name}</MettloText>
              <MettloText variant="caption" color={Colors.primary}>{CATEGORY_TR[biz.category] ?? biz.category}</MettloText>
            </View>
          </View>

          {/* Puan */}
          {biz.ratingAvg > 0 && (
            <View style={styles.row}>
              <MettloText>⭐ {biz.ratingAvg?.toFixed(1)} · {biz.ratingCount} değerlendirme</MettloText>
            </View>
          )}

          {/* Konum */}
          {(biz.city?.name || biz.district?.name) && (
            <View style={styles.row}>
              <MettloText color={Colors.textSecondary}>
                📍 {[biz.district?.name, biz.city?.name].filter(Boolean).join(', ')}
              </MettloText>
            </View>
          )}

          {/* Açıklama */}
          {biz.description && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>Hakkında</MettloText>
              <MettloText color={Colors.textSecondary}>{biz.description}</MettloText>
            </View>
          )}

          {/* İletişim */}
          {(biz.phonePublic || biz.website) && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>İletişim</MettloText>
              {biz.phonePublic && (
                <Pressable onPress={() => Linking.openURL(`tel:${biz.phonePublic}`)}>
                  <MettloText color={Colors.primary}>📞 {biz.phonePublic}</MettloText>
                </Pressable>
              )}
              {biz.website && (
                <Pressable onPress={() => Linking.openURL(biz.website)} style={{ marginTop: Space.s6 }}>
                  <MettloText color={Colors.primary}>🌐 {biz.website}</MettloText>
                </Pressable>
              )}
            </View>
          )}

          {/* Şubeler */}
          {biz.locations?.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>Şubeler</MettloText>
              {biz.locations.map((loc: any) => (
                <View key={loc.id} style={styles.locCard}>
                  <MettloText variant="bodySm" style={{ fontWeight: '600' }}>{loc.name ?? 'Ana Şube'}</MettloText>
                  <MettloText variant="caption" color={Colors.textMuted}>{loc.address}</MettloText>
                </View>
              ))}
            </View>
          )}

          {/* Koçlar */}
          {biz.coachWorkplaces?.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>Koçlar</MettloText>
              {biz.coachWorkplaces.map((cw: any, i: number) => (
                <Pressable key={i} style={styles.coachRow}
                  onPress={() => (nav as any).navigate('CoachDetail', { username: cw.creator?.user?.username })}>
                  <MettloText>{cw.creator?.displayName}</MettloText>
                  {cw.creator?.ratingAvg > 0 && <MettloText variant="caption" color={Colors.textMuted}>⭐ {cw.creator.ratingAvg?.toFixed(1)}</MettloText>}
                </Pressable>
              ))}
            </View>
          )}

          {/* Kampanyalar */}
          {biz.campaigns?.length > 0 && (
            <View style={styles.section}>
              <MettloText variant="h5" style={styles.sectionTitle}>Kampanyalar</MettloText>
              {biz.campaigns.map((c: any) => (
                <View key={c.id} style={styles.campaignCard}>
                  <MettloText style={{ fontWeight: '600' }}>{c.title}</MettloText>
                  {c.description && <MettloText variant="caption" color={Colors.textMuted}>{c.description}</MettloText>}
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
  coverWrap: { height: 200, position: 'relative' },
  backBtn: { position: 'absolute', top: Space.s16, left: Space.s16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.md, paddingHorizontal: Space.s12, paddingVertical: Space.s6 },
  backText: { color: '#fff' },
  logoWrap: { position: 'absolute', bottom: -30, left: Space.s16, width: 64, height: 64, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 2, borderColor: Colors.surface1 },
  logo: { width: '100%', height: '100%' },
  body: { paddingHorizontal: Space.s16, paddingTop: Space.s40, paddingBottom: Space.s32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Space.s8 },
  badge: { backgroundColor: Colors.primary + '22', color: Colors.primary, paddingHorizontal: Space.s8, paddingVertical: Space.s4, borderRadius: Radius.sm, fontSize: 12, fontWeight: '600' },
  row: { marginBottom: Space.s8 },
  section: { marginTop: Space.s24 },
  sectionTitle: { marginBottom: Space.s12 },
  locCard: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s12, marginBottom: Space.s8 },
  coachRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Space.s10, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  campaignCard: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s12, marginBottom: Space.s8 },
});
