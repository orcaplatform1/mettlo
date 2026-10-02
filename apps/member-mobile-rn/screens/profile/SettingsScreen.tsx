import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export function SettingsScreen() {
  const nav = useNavigation();
  const { user, logout } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState((user as any)?.bio ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.patch('/me/profile', { name, bio });
      Alert.alert('Kaydedildi', 'Profil bilgileriniz güncellendi.');
    } catch {
      Alert.alert('Hata', 'Güncellenemedi, tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/me/account');
              logout();
            } catch {
              Alert.alert('Hata', 'Hesap silinemedi.');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => nav.goBack()} hitSlop={12}>
            <MettloText color={Colors.textMuted}>← Geri</MettloText>
          </Pressable>
          <MettloText variant="h2">Ayarlar</MettloText>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <MettloAvatar uri={user?.avatarUrl} name={user?.name} size={88} verified={user?.isCoach} />
          <MettloText variant="caption" color={Colors.textMuted} style={{ marginTop: Space.s8 }}>
            Profil fotoğrafı değiştirmek için web sitesini kullanın.
          </MettloText>
        </View>

        {/* Profil */}
        <View style={styles.section}>
          <MettloText variant="caption" color={Colors.textMuted} style={styles.sectionLabel}>PROFİL</MettloText>

          <View style={styles.field}>
            <MettloText variant="caption" color={Colors.textMuted}>Ad Soyad</MettloText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Adınız"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <MettloText variant="caption" color={Colors.textMuted}>Kullanıcı Adı</MettloText>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.username ?? ''}
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <MettloText variant="caption" color={Colors.textMuted}>E-posta</MettloText>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email ?? ''}
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <MettloText variant="caption" color={Colors.textMuted}>Hakkımda</MettloText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Kendinizden kısaca bahsedin..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <MettloButton label={saving ? 'Kaydediliyor...' : 'Kaydet'} variant="primary" onPress={save} fullWidth />
        </View>

        {/* Gizlilik */}
        <View style={styles.section}>
          <MettloText variant="caption" color={Colors.textMuted} style={styles.sectionLabel}>GİZLİLİK</MettloText>
          <View style={styles.infoCard}>
            <MettloText variant="bodySm" color={Colors.textSecondary}>
              Gizlilik ayarları ve veri yönetimi için web sitesindeki ayarlar sayfasını ziyaret edin.
            </MettloText>
            <MettloText variant="caption" color={Colors.primary} style={{ marginTop: Space.s8 }}>mettlo.tr/app/settings</MettloText>
          </View>
        </View>

        {/* Tehlikeli bölge */}
        <View style={[styles.section, { marginBottom: Space.s32 }]}>
          <MettloText variant="caption" color={Colors.error} style={styles.sectionLabel}>TEHLİKELİ BÖLGE</MettloText>
          <MettloButton label="Hesabımı Sil" variant="danger" onPress={confirmDelete} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: Space.s40 },
  headerRow: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s8, gap: Space.s8 },
  avatarSection: { alignItems: 'center', paddingVertical: Space.s20 },
  section: { marginTop: Space.s16, paddingHorizontal: Space.s16, gap: Space.s12 },
  sectionLabel: { letterSpacing: 1, fontWeight: '700', marginBottom: Space.s4 },
  field: { gap: Space.s6 },
  input: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    padding: Space.s12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputDisabled: { opacity: 0.5 },
  textArea: { minHeight: 88 },
  infoCard: {
    backgroundColor: Colors.surface1,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Space.s16,
  },
});
