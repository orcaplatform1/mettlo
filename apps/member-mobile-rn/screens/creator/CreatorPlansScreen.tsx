import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const INTERVAL_TR: Record<string, string> = { MONTHLY: 'Aylık', QUARTERLY: '3 Aylık', BIANNUAL: '6 Aylık', ANNUAL: 'Yıllık' };
const fmtTL = (k: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(k / 100);

export function CreatorPlansScreen() {
  const nav = useNavigation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [interval, setInterval] = useState('MONTHLY');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['creator-plans'],
    queryFn: async () => {
      const res = await api.get('/creators/me/plans');
      return res.data as any[];
    },
  });

  async function createPlan() {
    if (!name.trim() || !price) { Alert.alert('Eksik', 'Ad ve fiyat zorunlu'); return; }
    setSaving(true);
    try {
      await api.post('/creators/me/plans', { name: name.trim(), priceKurus: Math.round(parseFloat(price) * 100), interval, description: desc.trim() || undefined });
      qc.invalidateQueries({ queryKey: ['creator-plans'] });
      setShowForm(false);
      setName(''); setPrice(''); setDesc('');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Plan oluşturulamadı');
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Abonelik Planları</MettloText>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <MettloText style={{ color: Colors.primary, fontWeight: '600' }}>{showForm ? 'İptal' : '+ Yeni'}</MettloText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 40 }}>
        <MettloText style={styles.info}>Fiyatı sen belirlersin. Mettlo tüm satışlardan %20 komisyon alır.</MettloText>

        {showForm && (
          <View style={styles.form}>
            <MettloText style={styles.formTitle}>Yeni Plan</MettloText>
            <View style={styles.field}>
              <MettloText style={styles.label}>Plan Adı *</MettloText>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Temel Plan" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.field}>
              <MettloText style={styles.label}>Fiyat (₺) *</MettloText>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="99.00" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.field}>
              <MettloText style={styles.label}>Dönem</MettloText>
              <View style={styles.intervals}>
                {Object.entries(INTERVAL_TR).map(([k, v]) => (
                  <TouchableOpacity key={k} style={[styles.chip, interval === k && styles.chipActive]} onPress={() => setInterval(k)}>
                    <MettloText style={[styles.chipText, interval === k && styles.chipTextActive] as any}>{v}</MettloText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <MettloText style={styles.label}>Açıklama</MettloText>
              <TextInput style={[styles.input, { height: 80, paddingTop: Space.s10 }]} value={desc} onChangeText={setDesc} multiline placeholder="Plan içeriğini yaz…" placeholderTextColor={Colors.textMuted} textAlignVertical="top" />
            </View>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={createPlan} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <MettloText style={{ color: '#fff', fontWeight: '700' }}>Planı Oluştur</MettloText>}
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? <MettloLoadingState /> : plans.length === 0 && !showForm ? (
          <MettloText style={styles.empty}>Henüz abonelik planın yok</MettloText>
        ) : (
          <View style={{ gap: Space.s10 }}>
            {plans.map((p: any) => (
              <View key={p.id} style={styles.planCard}>
                <View style={styles.planRow}>
                  <MettloText style={{ fontWeight: '700', fontSize: 16, flex: 1 }}>{p.name}</MettloText>
                  <MettloText style={styles.price}>{fmtTL(p.priceKurus)} / {INTERVAL_TR[p.interval] ?? p.interval}</MettloText>
                </View>
                {p.description && <MettloText style={styles.desc}>{p.description}</MettloText>}
                <MettloText style={styles.caption}>{p._count?.entitlements ?? p.subscriberCount ?? 0} aktif abone</MettloText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  info: { fontSize: 13, color: Colors.textMuted, marginBottom: Space.s16, lineHeight: 18 },
  form: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Space.s16 },
  formTitle: { fontWeight: '700', fontSize: 16, marginBottom: Space.s16 },
  field: { marginBottom: Space.s14 },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: Space.s6 },
  input: { backgroundColor: Colors.surface1, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 48, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
  intervals: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s8, borderRadius: Radius.pill, backgroundColor: Colors.surface1, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: Space.s8 },
  planCard: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s12, marginBottom: Space.s6 },
  price: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  desc: { fontSize: 13, color: Colors.textSecondary, marginBottom: Space.s6, lineHeight: 18 },
  caption: { fontSize: 12, color: Colors.textMuted },
  empty: { textAlign: 'center', color: Colors.textMuted, paddingVertical: Space.s32 },
});
