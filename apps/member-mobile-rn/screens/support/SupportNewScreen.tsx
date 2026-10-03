import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  { key: 'account', label: 'Hesap' },
  { key: 'payment', label: 'Ödeme' },
  { key: 'subscription', label: 'Abonelik' },
  { key: 'technical', label: 'Teknik' },
  { key: 'content', label: 'İçerik' },
  { key: 'live', label: 'Canlı' },
  { key: 'coaching', label: 'Koçluk' },
  { key: 'other', label: 'Diğer' },
];

export function SupportNewScreen() {
  const nav = useNavigation<Nav>();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('other');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Eksik Bilgi', 'Konu ve mesaj alanlarını doldur');
      return;
    }
    setSaving(true);
    try {
      await api.post('/support/tickets', { subject: subject.trim(), category, body: body.trim() });
      Alert.alert('Gönderildi', 'Destek talebiniz oluşturuldu', [
        { text: 'Tamam', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Gönderilemedi');
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Yeni Destek Talebi</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 40 }}>
        <View style={styles.field}>
          <MettloText style={styles.label}>Konu *</MettloText>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Kısaca sorununu yaz (3–120 karakter)"
            placeholderTextColor={Colors.textMuted}
            maxLength={120}
          />
        </View>

        <View style={styles.field}>
          <MettloText style={styles.label}>Kategori</MettloText>
          <View style={styles.chips}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.key} style={[styles.chip, category === c.key && styles.chipActive]} onPress={() => setCategory(c.key)}>
                <MettloText style={[styles.chipText, category === c.key && styles.chipTextActive] as any}>{c.label}</MettloText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <MettloText style={styles.label}>Mesaj *</MettloText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Sorununu detaylıca anlat…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={4000}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.5 }]} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <MettloText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Gönder</MettloText>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  field: { marginBottom: Space.s20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: Space.s8 },
  input: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 48, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
  textArea: { height: 140, paddingTop: Space.s12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8 },
  chip: { paddingHorizontal: Space.s12, paddingVertical: Space.s8, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Space.s8 },
});
