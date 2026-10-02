import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloInput } from '../../components/ui/MettloInput';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Space } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { extractError } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function RegisterScreen() {
  const nav = useNavigation<Nav>();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof typeof form) {
    return (val: string) => setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleRegister() {
    const { name, username, email, password } = form;
    if (!name || !username || !email || !password) { setError('Tüm alanları doldurun.'); return; }
    setError(''); setLoading(true);
    try {
      await register(name, username, email, password);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => nav.goBack()} hitSlop={12}>
              <MettloText color={Colors.textMuted}>← Geri</MettloText>
            </Pressable>
            <MettloText variant="h2">Hesap Oluştur</MettloText>
            <MettloText variant="body" color={Colors.textMuted}>Mettlo'ya ücretsiz katıl</MettloText>
          </View>

          <View style={styles.form}>
            <MettloInput label="Adınız" value={form.name} onChangeText={set('name')} placeholder="Ad Soyad" autoComplete="name" />
            <MettloInput label="Kullanıcı Adı" value={form.username} onChangeText={set('username')} placeholder="mettlo_kullanici" autoCapitalize="none" />
            <MettloInput label="E-posta" value={form.email} onChangeText={set('email')} placeholder="ornek@email.com" keyboardType="email-address" autoComplete="email" />
            <MettloInput label="Şifre" value={form.password} onChangeText={set('password')} placeholder="En az 8 karakter" isPassword autoComplete="new-password" />

            {error ? <MettloText variant="bodySm" color={Colors.error}>{error}</MettloText> : null}

            <MettloButton label="Kayıt Ol" onPress={handleRegister} loading={loading} fullWidth size="lg" />

            <MettloText variant="caption" color={Colors.textMuted} style={styles.legal}>
              Kayıt olarak Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.
            </MettloText>
          </View>

          <View style={styles.footer}>
            <MettloText variant="body" color={Colors.textMuted}>Zaten hesabın var mı?</MettloText>
            <Pressable onPress={() => nav.navigate('Login')} hitSlop={8}>
              <MettloText variant="body" color={Colors.primary} style={{ fontWeight: '700' }}> Giriş Yap</MettloText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Space.s24, gap: Space.s20 },
  header: { gap: Space.s8, marginBottom: Space.s8 },
  form: { gap: Space.s16 },
  legal: { textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});
