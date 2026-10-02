import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';

const FREE_FEATURES = [
  '~1.000 sağlıklı yemek tarifi',
  'Sağlıklı beslenme içerikleri',
  'Temel fitness içerikleri',
  'Branş ve koç keşfi',
  'İşletme keşfi',
  'Temel gelişim takibi',
  'Topluluk erişimi',
];

const PREMIUM_FEATURES = [
  'Ücretsizin tamamı +',
  'Sınırsız program erişimi',
  '1:1 Koçluk randevusu',
  'Canlı derslere katılım',
  'Challenge katılımı',
  'AI destekli gelişim takibi',
  'Gelişmiş sağlık analizi',
  'Öncelikli destek',
];

export function PricingScreen() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MettloText variant="h2" style={styles.center}>Fiyatlar</MettloText>
          <MettloText variant="body" color={Colors.textMuted} style={styles.center}>
            Ücretsiz başla, istediğinde yükselt
          </MettloText>
        </View>

        {/* Billing toggle */}
        <View style={styles.toggleWrap}>
          <Pressable
            onPress={() => setBilling('monthly')}
            style={[styles.toggleBtn, billing === 'monthly' && styles.toggleBtnActive]}
          >
            <MettloText variant="bodySm" color={billing === 'monthly' ? '#fff' : Colors.textMuted} style={billing === 'monthly' ? { fontWeight: '700' } : undefined}>Aylık</MettloText>
          </Pressable>
          <Pressable
            onPress={() => setBilling('yearly')}
            style={[styles.toggleBtn, billing === 'yearly' && styles.toggleBtnActive]}
          >
            <MettloText variant="bodySm" color={billing === 'yearly' ? '#fff' : Colors.textMuted} style={billing === 'yearly' ? { fontWeight: '700' } : undefined}>Yıllık</MettloText>
            {billing === 'yearly' && <MettloText variant="caption" color={Colors.success}> %30 indirim</MettloText>}
          </Pressable>
        </View>

        {/* Free plan */}
        <View style={styles.planCard}>
          <MettloText variant="h4">Ücretsiz</MettloText>
          <View style={styles.priceRow}>
            <MettloText variant="displayXL" style={{ fontWeight: '800' }}>₺0</MettloText>
            <MettloText variant="body" color={Colors.textMuted}>/ay</MettloText>
          </View>
          <MettloButton label="Şu An Kullanıyorsun" variant="secondary" size="lg" fullWidth disabled />
          <View style={styles.featureList}>
            {FREE_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <MettloText color={Colors.success}>✓</MettloText>
                <MettloText variant="body" color={Colors.textSecondary}>{f}</MettloText>
              </View>
            ))}
          </View>
        </View>

        {/* Premium plan */}
        <LinearGradient
          colors={['rgba(249,115,22,0.12)', 'rgba(236,72,153,0.08)']}
          style={[styles.planCard, styles.premiumCard]}
        >
          <View style={styles.popularBadge}>
            <MettloText variant="caption" color={Colors.primary} style={{ fontWeight: '700' }}>⭐ En Popüler</MettloText>
          </View>
          <MettloText variant="h4">Premium</MettloText>
          <View style={styles.priceRow}>
            <MettloText variant="displayXL" style={{ fontWeight: '800', color: Colors.primary }}>
              {billing === 'yearly' ? '₺140' : '₺199'}
            </MettloText>
            <MettloText variant="body" color={Colors.textMuted}>/ay</MettloText>
          </View>
          {billing === 'yearly' && (
            <MettloText variant="caption" color={Colors.textMuted}>Yıllık ₺1.680 · ₺84 tasarruf</MettloText>
          )}
          <MettloButton label="Premium'a Geç" size="lg" fullWidth onPress={() => {/* TODO: subscription flow (App Store / Play Store IAP) */}} />
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <MettloText color={Colors.primary}>✓</MettloText>
                <MettloText variant="body" color={Colors.textSecondary}>{f}</MettloText>
              </View>
            ))}
          </View>
        </LinearGradient>

        <MettloText variant="caption" color={Colors.textMuted} style={styles.iapNote}>
          Ödeme Apple App Store veya Google Play üzerinden gerçekleştirilir. İstediğin zaman iptal edebilirsin.
        </MettloText>

        <View style={{ height: Space.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s20, paddingTop: Space.s20, paddingBottom: Space.s8, gap: Space.s8 },
  center: { textAlign: 'center' },
  toggleWrap: { flexDirection: 'row', margin: Space.s20, backgroundColor: Colors.surface2, borderRadius: Radius.xl, padding: Space.s4 },
  toggleBtn: { flex: 1, paddingVertical: Space.s10, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, flexDirection: 'row' },
  toggleBtnActive: { backgroundColor: Colors.surface3 },
  planCard: { marginHorizontal: Space.s16, marginBottom: Space.s16, backgroundColor: Colors.surface1, borderRadius: Radius.hero, padding: Space.s24, gap: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle },
  premiumCard: { borderColor: 'rgba(249,115,22,0.3)' },
  popularBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(249,115,22,0.12)', borderRadius: Radius.pill, paddingHorizontal: Space.s12, paddingVertical: Space.s4, borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Space.s4 },
  featureList: { gap: Space.s10, marginTop: Space.s8 },
  featureRow: { flexDirection: 'row', gap: Space.s10 },
  iapNote: { textAlign: 'center', paddingHorizontal: Space.s24, lineHeight: 18 },
});
