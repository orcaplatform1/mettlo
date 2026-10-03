import React, { useState } from 'react';
import {
  Image, KeyboardAvoidingView, Linking, Platform, Pressable,
  ScrollView, StyleSheet, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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

function GoogleIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={20} height={20}>
      <Path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <Path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <Path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <Path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={20} height={20}>
      <Path fill="white" d="M16.37 1.43c0 1.14-.42 2.22-1.14 3-.78.86-2.04 1.53-3.09 1.44-.13-1.1.4-2.24 1.1-2.96.78-.84 2.13-1.47 3.13-1.48zM20.9 17.1c-.55 1.26-.82 1.82-1.53 2.93-1 1.55-2.4 3.48-4.14 3.5-1.55.02-1.95-1-4.05-.99-2.1.01-2.54 1.01-4.09.99-1.74-.02-3.07-1.76-4.07-3.3C-.02 15.9-.33 11.06 1.4 8.52c1.23-1.8 3.17-2.86 5-2.86 1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.4-1.02 4.55-1.02 1.63 0 3.36.89 4.6 2.42-4.04 2.22-3.38 8 .78 9.02z" />
    </Svg>
  );
}

export function LoginScreen() {
  const nav = useNavigation<Nav>();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!username.trim() || !password) { setError('Kullanıcı adı ve şifre zorunludur.'); return; }
    if (needsTotp && !totp.trim()) { setError('Doğrulama kodunu gir.'); return; }
    setError(''); setLoading(true);
    try {
      await login(username.trim(), password, needsTotp ? totp.trim() : undefined);
    } catch (e: any) {
      const msg: string = extractError(e);
      const raw: string = e?.response?.data?.message ?? e?.response?.data?.error ?? '';
      const isTotpRequired =
        msg.toLowerCase().includes('doğrulama') ||
        msg.toLowerCase().includes('totp') ||
        msg.toLowerCase().includes('verification') ||
        raw.toLowerCase().includes('totp') ||
        raw.toLowerCase().includes('otp') ||
        e?.response?.status === 428;
      if (isTotpRequired) {
        setNeedsTotp(true);
        setError('Doğrulama kodunu girerek devam et.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoRow}>
            <Image source={require('../../assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
            <MettloText variant="displayXL" style={styles.logoText}>METTLO</MettloText>
          </View>

          {/* Kart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MettloText variant="h3">Giriş Yap</MettloText>
              <MettloText variant="bodySm" color={Colors.textSecondary}>
                Kullanıcı adın ve şifrenle devam et.
              </MettloText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <MettloInput
                label="Kullanıcı adı"
                value={username}
                onChangeText={setUsername}
                placeholder="kullaniciadi"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <MettloInput
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                placeholder="6–20 karakter"
                isPassword
                autoComplete="password"
              />
              {needsTotp && (
                <MettloInput
                  label="Doğrulama Kodu"
                  value={totp}
                  onChangeText={setTotp}
                  placeholder="6 haneli kod"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              )}
              {error ? (
                <MettloText variant="bodySm" color={needsTotp ? Colors.primary : Colors.error}>
                  {error}
                </MettloText>
              ) : null}

              <MettloButton label="Giriş Yap" onPress={handleLogin} loading={loading} fullWidth size="lg" />
            </View>

            {/* Hesabın yok mu */}
            <View style={styles.registerRow}>
              <MettloText variant="bodySm" color={Colors.textSecondary}>Hesabın yok mu?</MettloText>
              <Pressable onPress={() => nav.navigate('Register')} hitSlop={8}>
                <MettloText variant="bodySm" color={Colors.secondary} style={styles.linkText}> Hemen Başla</MettloText>
              </Pressable>
            </View>

            {/* Divider — veya */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <MettloText variant="caption" color={Colors.textMuted}>veya</MettloText>
              <View style={styles.dividerLine} />
            </View>

            {/* Sosyal giriş: Apple üstte, Google altta */}
            <View style={styles.socialWrap}>
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.75}
                onPress={() => Linking.openURL('https://mettlo.tr/auth/social/apple/start')}
              >
                <AppleIcon />
                <MettloText style={styles.socialBtnText}>Apple ile devam et</MettloText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.75}
                onPress={() => Linking.openURL('https://mettlo.tr/auth/social/google/start')}
              >
                <GoogleIcon />
                <MettloText style={styles.socialBtnText}>Google ile devam et</MettloText>
              </TouchableOpacity>
            </View>

            {/* Alt metin */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <MettloText variant="caption" color={Colors.textMuted} style={{ letterSpacing: 0.4 }}>
                VEYA KULLANICI ADINLA
              </MettloText>
              <View style={styles.dividerLine} />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: Space.s20, paddingVertical: Space.s32, justifyContent: 'center', gap: Space.s24 },
  logoRow: { alignItems: 'center', gap: Space.s8 },
  logoImg: { width: 64, height: 64 },
  logoText: { letterSpacing: 8, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.surface1,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Space.s24,
    gap: Space.s16,
  },
  cardHeader: { gap: Space.s4 },
  form: { gap: Space.s16 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Space.s10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderSubtle },
  socialWrap: { gap: Space.s10 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.s10,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.pill,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
