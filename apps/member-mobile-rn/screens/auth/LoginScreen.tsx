import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloInput } from '../../components/ui/MettloInput';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { extractError } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const nav = useNavigation<Nav>();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!username.trim() || !password) { setError('Kullanıcı adı ve şifre zorunludur.'); return; }
    setError(''); setLoading(true);
    try {
      await login(username.trim(), password);
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
          <View style={styles.logoRow}>
            <MettloText variant="displayXL" style={styles.logoText}>METTLO</MettloText>
            <LinearGradient colors={['#F97316', '#FB7185', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.logoBar}
            />
          </View>

          <MettloText variant="h2" style={styles.title}>Hoş geldin</MettloText>
          <MettloText variant="body" color={Colors.textMuted} style={styles.subtitle}>
            Mettlo hesabınla giriş yap
          </MettloText>

          <View style={styles.form}>
            <MettloInput
              label="Kullanıcı adı veya e-posta"
              value={username}
              onChangeText={setUsername}
              placeholder="kullanıcıadı veya email"
              autoComplete="username"
            />
            <MettloInput
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              isPassword
              autoComplete="password"
            />
            {error ? <MettloText variant="bodySm" color={Colors.error}>{error}</MettloText> : null}

            <MettloButton label="Giriş Yap" onPress={handleLogin} loading={loading} fullWidth size="lg" />
          </View>

          <View style={styles.footer}>
            <MettloText variant="body" color={Colors.textMuted}>Hesabın yok mu?</MettloText>
            <Pressable onPress={() => nav.navigate('Register')} hitSlop={8}>
              <MettloText variant="body" color={Colors.primary} style={{ fontWeight: '700' }}> Kayıt Ol</MettloText>
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
  container: { flexGrow: 1, padding: Space.s24, justifyContent: 'center', gap: Space.s20 },
  logoRow: { alignItems: 'center', gap: Space.s8, marginBottom: Space.s16 },
  logoText: { letterSpacing: 8, color: Colors.textPrimary },
  logoBar: { width: 48, height: 3, borderRadius: Radius.pill },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: -Space.s12 },
  form: { gap: Space.s16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Space.s8 },
});
