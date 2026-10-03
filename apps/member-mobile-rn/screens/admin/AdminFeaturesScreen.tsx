import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function AdminFeaturesScreen() {
  const nav = useNavigation();
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/platform-config');
      setFeatures(Array.isArray(res.data) ? res.data : Object.entries(res.data).map(([key, value]) => ({ key, value })));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function toggle(key: string, current: any) {
    const newVal = typeof current === 'boolean' ? !current : current === 'true' ? 'false' : 'true';
    setToggling(key);
    try {
      await api.patch(`/admin/platform-config/${key}`, { value: newVal });
      setFeatures(prev => prev.map(f => f.key === key ? { ...f, value: newVal } : f));
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi');
    } finally { setToggling(null); }
  }

  const FEATURE_LABELS: Record<string, { label: string; desc?: string }> = {
    AUTO_PAYOUT_ENABLED: { label: 'Otomatik Ödeme', desc: 'Koçlara otomatik ödeme yap' },
    ENABLE_AI_MATCHING: { label: 'AI Eşleştirme', desc: 'Üyelere AI destekli koç önerisi' },
    ENABLE_COACH_JOBS: { label: 'Koç İlanları', desc: 'İşletmelerin koç işe alım ilanları' },
    ENABLE_EVENTS: { label: 'Etkinlikler', desc: 'Platform etkinlik modülü' },
    ENABLE_FOOD_BUSINESS: { label: 'Yemek İşletmeleri', desc: 'Yemek/beslenme işletme profili' },
    ENABLE_LIVE: { label: 'Canlı Dersler', desc: 'Canlı yayın modülü' },
    ENABLE_STORE: { label: 'Mağaza', desc: 'Ürün satış mağazası' },
    ENABLE_COMMUNITY: { label: 'Topluluk', desc: 'Forum & gönderi akışı' },
    MAINTENANCE_MODE: { label: 'Bakım Modu', desc: 'Siteyi bakım moduna al' },
    PAYOUT_MIN_AMOUNT_KURUS: { label: 'Min. Ödeme Tutarı', desc: 'Kuruş cinsinden minimum ödeme eşiği' },
    PAYOUT_SETTLEMENT_DAYS: { label: 'Ödeme Bekleme Günü', desc: 'Ödemeden önce bekleme süresi (gün)' },
    COMMISSION_RATE_PCT: { label: 'Komisyon Oranı (%)', desc: 'Platform komisyon yüzdesi' },
    FREE_TRIAL_DAYS: { label: 'Ücretsiz Deneme (gün)', desc: 'Yeni üyelere deneme süresi' },
  };

  const isBool = (v: any) => typeof v === 'boolean' || v === 'true' || v === 'false';
  const toBool = (v: any) => v === true || v === 'true';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Platform Özellikleri</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 32 }}>
          {features.map(f => {
            const meta = FEATURE_LABELS[f.key];
            return (
            <View key={f.key} style={styles.item}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>{meta?.label ?? f.key}</MettloText>
                {meta?.desc && <MettloText style={styles.caption}>{meta.desc}</MettloText>}
                {!isBool(f.value) && !meta?.desc && (
                  <MettloText style={styles.caption}>{String(f.value)}</MettloText>
                )}
              </View>
              {isBool(f.value) ? (
                <Switch
                  value={toBool(f.value)}
                  onValueChange={() => toggle(f.key, f.value)}
                  disabled={toggling === f.key}
                  trackColor={{ false: Colors.borderSubtle, true: Colors.primary }}
                  thumbColor="#fff"
                />
              ) : (
                <MettloText style={styles.caption}>{typeof f.value === 'object' ? JSON.stringify(f.value) : String(f.value)}</MettloText>
              )}
            </View>
            );
          })}
          {features.length === 0 && <MettloText style={styles.empty}>Özellik bulunamadı</MettloText>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Space.s10, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
