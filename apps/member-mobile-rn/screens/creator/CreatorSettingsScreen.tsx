import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space, Typography } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface CreatorProfile {
  displayName?: string;
  headline?: string;
  bio?: string;
  whyChooseMe?: string;
  expertise?: string[];
  careerStartYear?: number;
}

export function CreatorSettingsScreen() {
  const nav = useNavigation<Nav>();
  const [profile, setProfile] = useState<CreatorProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<CreatorProfile>('/creators/me');
      setProfile(res.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api.patch('/creators/me', {
        displayName: profile.displayName,
        headline: profile.headline,
        bio: profile.bio,
        whyChooseMe: profile.whyChooseMe,
        expertise: profile.expertise,
        careerStartYear: profile.careerStartYear,
      });
      Alert.alert('Kaydedildi', 'Profil bilgilerin güncellendi.');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydetme başarısız.');
    } finally { setSaving(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Koç Profili</MettloText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {([
          { label: 'Görünen Ad', key: 'displayName', placeholder: 'Koç adın', maxLength: 60 },
          { label: 'Başlık', key: 'headline', placeholder: '120 karaktere kadar kısa tanıtım', maxLength: 120 },
          { label: 'Biyografi', key: 'bio', placeholder: 'Kendin hakkında...', maxLength: 2000, multiline: true },
          { label: 'Neden Beni Seçmelisiniz?', key: 'whyChooseMe', placeholder: 'Farkın nedir?', maxLength: 1500, multiline: true },
        ] as any[]).map(f => (
          <View key={f.key} style={styles.field}>
            <MettloText style={styles.label}>{f.label}</MettloText>
            <TextInput
              style={[styles.input, f.multiline && styles.multiline]}
              value={(profile as any)[f.key] ?? ''}
              onChangeText={v => setProfile(prev => ({ ...prev, [f.key]: v }))}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.textMuted}
              maxLength={f.maxLength}
              multiline={f.multiline}
              textAlignVertical={f.multiline ? 'top' : 'center'}
              autoCorrect={false}
            />
          </View>
        ))}

        <View style={styles.field}>
          <MettloText style={styles.label}>Kariyer Başlangıç Yılı</MettloText>
          <TextInput
            style={styles.input}
            value={profile.careerStartYear ? String(profile.careerStartYear) : ''}
            onChangeText={v => setProfile(prev => ({ ...prev, careerStartYear: parseInt(v) || undefined }))}
            placeholder="Örn: 2015"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <MettloButton label="💾 Kaydet" onPress={save} loading={saving} fullWidth size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  content: { padding: Space.s16, gap: Space.s16 },
  field: { gap: Space.s6 },
  label: { ...Typography.bodySm, color: Colors.textSecondary, fontWeight: '500' },
  input: { backgroundColor: Colors.surface2, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.borderSubtle, paddingHorizontal: Space.s14, height: 50, color: Colors.textPrimary, fontSize: 15 },
  multiline: { height: 120, paddingVertical: Space.s12 },
});
