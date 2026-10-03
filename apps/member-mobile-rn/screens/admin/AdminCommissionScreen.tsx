import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

export function AdminCommissionScreen() {
  const nav = useNavigation();
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/commission');
      setSettings(Array.isArray(res.data) ? res.data : Object.entries(res.data).map(([key, value]) => ({ key, value })));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setSaving(key);
    try {
      await api.patch(`/admin/commission/${key}`, { value: editing[key] });
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: editing[key] } : s));
      setEditing(prev => { const n = { ...prev }; delete n[key]; return n; });
      Alert.alert('Kaydedildi', 'Komisyon ayarı güncellendi');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi');
    } finally { setSaving(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Komisyon Ayarları</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 32 }}>
          <MettloText style={styles.info}>Mettlo'nun tüm koç satışlarından aldığı komisyon oranlarını buradan yönet.</MettloText>
          {settings.map(s => {
            const LABELS: Record<string, { label: string; desc: string; unit: string }> = {
              CHALLENGE:         { label: 'Meydan Okuma', desc: 'Challenge satışlarından komisyon', unit: '%' },
              EVENT_TICKET:      { label: 'Etkinlik Bileti', desc: 'Etkinlik bileti satışlarından komisyon', unit: '%' },
              FOOD_ORDER:        { label: 'Yemek Siparişi', desc: 'Yemek siparişlerinden komisyon', unit: '%' },
              ONE_TO_ONE_COACHING: { label: 'Birebir Koçluk', desc: 'Birebir koçluk satışlarından komisyon', unit: '%' },
              PROGRAM:           { label: 'Program', desc: 'Program satışlarından komisyon', unit: '%' },
              SESSION:           { label: 'Seans', desc: 'Seans / ders satışlarından komisyon', unit: '%' },
              SUBSCRIPTION:      { label: 'Abonelik', desc: 'Koç abonelik ödemelerinden komisyon', unit: '%' },
              STORE_PRODUCT:     { label: 'Mağaza Ürünü', desc: 'Fiziksel/dijital ürün satışlarından komisyon', unit: '%' },
              LIVE_SESSION:      { label: 'Canlı Ders', desc: 'Canlı ders biletlerinden komisyon', unit: '%' },
            };
            const meta = LABELS[s.key];
            return (
            <View key={s.key} style={styles.item}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Space.s4 }}>
                <MettloText style={styles.label}>{meta?.label ?? s.key}</MettloText>
                {meta?.unit && <MettloText style={styles.unit}>{meta.unit}</MettloText>}
              </View>
              {meta?.desc && <MettloText style={styles.key}>{meta.desc}</MettloText>}
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={editing[s.key] ?? String(s.value ?? '')}
                  onChangeText={v => setEditing(prev => ({ ...prev, [s.key]: v }))}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                {editing[s.key] !== undefined && (
                  <TouchableOpacity
                    style={[styles.saveBtn, saving === s.key && { opacity: 0.5 }]}
                    onPress={() => save(s.key)}
                    disabled={saving === s.key}
                  >
                    {saving === s.key ? <ActivityIndicator color="#fff" size="small" /> : <MettloText style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Kaydet</MettloText>}
                  </TouchableOpacity>
                )}
              </View>
            </View>
            );
          })}
          {settings.length === 0 && <MettloText style={styles.empty}>Ayar bulunamadı</MettloText>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { fontSize: 13, color: Colors.textMuted, marginBottom: Space.s20, lineHeight: 20 },
  item: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Space.s12 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  unit: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  key: { fontSize: 12, color: Colors.textMuted, marginBottom: Space.s8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.s10 },
  input: { flex: 1, backgroundColor: Colors.surface1, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 44, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
  saveBtn: { height: 44, paddingHorizontal: Space.s16, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
});
