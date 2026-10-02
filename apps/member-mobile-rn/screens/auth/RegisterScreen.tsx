import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloInput } from '../../components/ui/MettloInput';
import { MettloButton } from '../../components/ui/MettloButton';
import { LegalConsentModal } from '../../components/ui/LegalConsentModal';
import { DatePickerModal } from '../../components/ui/DatePickerModal';
import { Colors, Radius, Space, Typography } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { api, extractError } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function getAge(d: Date) {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function validateUsername(v: string) {
  if (v.length < 3) return 'En az 3 karakter gerekli';
  if (v.length > 30) return 'En fazla 30 karakter';
  if (!/^[a-z0-9_]+$/.test(v)) return 'Sadece küçük harf, rakam ve alt çizgi';
  return null;
}

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

function ConsentRow({ checked, onCheckboxPress, onLinkPress, linkText, suffix, showError }: {
  checked: boolean;
  onCheckboxPress: () => void;
  onLinkPress: () => void;
  linkText: string;
  suffix: string;
  showError: boolean;
}) {
  return (
    <View style={cStyles.row}>
      <TouchableOpacity
        onPress={onCheckboxPress}
        activeOpacity={0.7}
        style={[cStyles.box, showError && cStyles.boxError, checked && cStyles.boxChecked]}
      >
        {checked && <Text style={cStyles.tick}>✓</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={cStyles.text}>
          <Text onPress={onLinkPress} style={cStyles.link}>{linkText}</Text>
          <Text style={cStyles.suffix}>{suffix}</Text>
        </Text>
      </View>
    </View>
  );
}

const cStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Space.s10, alignItems: 'flex-start', paddingVertical: Space.s4 },
  box: {
    width: 22, height: 22, marginTop: 1, borderRadius: 5,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  boxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  boxError: { borderColor: Colors.error },
  tick: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 16 },
  text: { fontSize: 13.5, lineHeight: 20 },
  link: { color: Colors.secondary, fontWeight: '600', fontSize: 13.5 },
  suffix: { color: Colors.textSecondary, fontSize: 13.5 },
});

export function RegisterScreen() {
  const nav = useNavigation<Nav>();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);

  const [terms, setTerms] = useState(false);
  const [kvkk, setKvkk] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [uStatus, setUStatus] = useState<UsernameStatus>('idle');
  const [uMsg, setUMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const checkUsername = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (validateUsername(val) !== null) { setUStatus('idle'); setUMsg(''); return; }
    setUStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/public/check-username?username=${encodeURIComponent(val)}`);
        const d = res.data as { available: boolean; message?: string };
        setUStatus(d.available ? 'available' : 'taken');
        setUMsg(d.message ?? '');
      } catch { setUStatus('idle'); }
    }, 400);
  }, []);

  function onUsernameChange(val: string) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    checkUsername(clean);
  }

  function onPhoneChange(val: string) {
    setPhone(val.replace(/\D/g, '').slice(0, 10));
  }

  function handleTermsCheckbox() {
    if (!terms) setShowTermsModal(true);
    else setTerms(false);
  }

  function handleKvkkCheckbox() {
    if (!kvkk) setShowKvkkModal(true);
    else setKvkk(false);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Ad soyad gerekli (en az 2 karakter)';
    const uErr = validateUsername(username);
    if (uErr) errs.username = uErr;
    if (uStatus === 'taken') errs.username = uMsg || 'Bu kullanıcı adı alınmış';
    if (!validateEmail(email)) errs.email = 'Geçerli bir e-posta girin (örn: ad@site.com)';
    if (phone.length !== 10) errs.phone = 'Telefon numarası tam 10 rakam olmalıdır';
    if (password.length < 6) errs.password = 'Şifre en az 6 karakter olmalı';
    if (password.length > 20) errs.password = 'Şifre en fazla 20 karakter olabilir';
    if (password2 !== password) errs.password2 = 'Şifreler eşleşmiyor';
    if (!birthDate) errs.birthDate = 'Doğum tarihi seçin';
    else if (getAge(birthDate) < 18) errs.birthDate = '18 yaşından küçükler yalnızca ebeveyn / yasal vasi kaydı ile üye olabilir';
    return errs;
  }

  async function handleRegister() {
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    if (!terms) { setError('Kullanım Koşulları\'nı kabul etmelisiniz.'); return; }
    if (!kvkk) { setError('KVKK Aydınlatma Metni\'ni kabul etmelisiniz.'); return; }

    setFieldErrors({});
    setError('');
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: '+90' + phone.trim(),
        password,
        birthDate: toISO(birthDate!),
        acceptTerms: true,
        acceptKvkk: true,
        marketingConsent: false,
      });
    } catch (e: any) {
      const serverFieldErrors = e?.response?.data?.fieldErrors ?? e?.response?.data?.errors ?? {};
      if (Object.keys(serverFieldErrors).length > 0) setFieldErrors(serverFieldErrors);
      else setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }

  const uHint =
    uStatus === 'checking' ? 'Kontrol ediliyor…'
    : uStatus === 'available' ? `✓ ${uMsg || 'Kullanılabilir'}`
    : uStatus === 'taken' ? `⊘ ${uMsg || 'Bu kullanıcı adı alınmış'}`
    : username.length >= 3 ? `Profil adresin: mettlo.tr/profile/${username} · Yalnızca a-z, 0-9 ve _`
    : '';

  const uHintColor =
    uStatus === 'available' ? Colors.success
    : uStatus === 'taken' ? Colors.error
    : Colors.textMuted;

  const birthError = submitted && !birthDate ? 'Doğum tarihi seçin'
    : submitted && birthDate && getAge(birthDate) < 18 ? '18 yaş ve üzeri gerekmektedir'
    : fieldErrors.birthDate;

  const maxBirth = new Date();
  maxBirth.setFullYear(maxBirth.getFullYear() - 18);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Geri butonu (kart dışı) */}
          <Pressable onPress={() => nav.goBack()} hitSlop={12} style={styles.backBtn}>
            <MettloText color={Colors.textMuted}>← Geri</MettloText>
          </Pressable>

          {/* Kart */}
          <View style={styles.card}>
            {/* Kart başlığı */}
            <View style={styles.cardHeader}>
              <MettloText variant="h3">Mettlo'ya katıl</MettloText>
              <MettloText variant="bodySm" color={Colors.textSecondary}>
                Birkaç bilgiyle hesabını oluştur. Profil adresin kullanıcı adından oluşur.
              </MettloText>
            </View>

            {/* Hata banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <MettloText variant="bodySm" color={Colors.error}>{error}</MettloText>
              </View>
            ) : null}

            {/* Form alanları */}
            <View style={styles.form}>

              <MettloInput
                label="Ad Soyad"
                value={name}
                onChangeText={setName}
                placeholder="Ad Soyad"
                autoComplete="name"
                autoCapitalize="words"
                error={submitted ? fieldErrors.name : undefined}
              />

              <View style={styles.fieldWrap}>
                <MettloInput
                  label="Kullanıcı adı"
                  value={username}
                  onChangeText={onUsernameChange}
                  placeholder="mettlo_kullanici"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                  error={(submitted && (uStatus === 'taken' || !!fieldErrors.username))
                    ? (fieldErrors.username || uMsg || 'Bu kullanıcı adı alınmış')
                    : undefined}
                />
                {uHint ? (
                  <MettloText style={[styles.hint, { color: uHintColor }]}>{uHint}</MettloText>
                ) : null}
              </View>

              <MettloInput
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6, en fazla 20 karakter"
                isPassword
                autoComplete="new-password"
                maxLength={20}
                error={submitted ? fieldErrors.password : undefined}
              />

              <MettloInput
                label="Şifre (tekrar)"
                value={password2}
                onChangeText={setPassword2}
                placeholder="Şifrenizi tekrar girin"
                isPassword
                autoComplete="new-password"
                maxLength={20}
                error={submitted ? fieldErrors.password2 : undefined}
              />

              <MettloInput
                label="E-posta"
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                error={submitted ? fieldErrors.email : undefined}
              />

              {/* Telefon */}
              <View style={styles.fieldWrap}>
                <MettloText style={styles.fieldLabel}>Telefon</MettloText>
                <View style={[styles.phoneRow, submitted && fieldErrors.phone ? styles.phoneRowError : null]}>
                  <View style={styles.phonePrefix}>
                    <MettloText style={styles.phonePrefixText}>🇹🇷 +90</MettloText>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={onPhoneChange}
                    placeholder="5xx xxx xx xx"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={10}
                    style={styles.phoneInput}
                  />
                </View>
                {submitted && fieldErrors.phone ? (
                  <MettloText style={styles.errorText}>{fieldErrors.phone}</MettloText>
                ) : null}
              </View>

              {/* Doğum tarihi */}
              <View style={styles.fieldWrap}>
                <MettloText style={styles.fieldLabel}>Doğum Tarihi</MettloText>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.dateTrigger, birthError ? styles.dateTriggerError : null]}
                >
                  <MettloText style={{ color: birthDate ? Colors.textPrimary : Colors.textMuted, fontSize: 15 }}>
                    {birthDate ? formatDate(birthDate) : 'GG.AA.YYYY'}
                  </MettloText>
                  <MettloText style={{ fontSize: 18 }}>📅</MettloText>
                </TouchableOpacity>
                <MettloText style={styles.dateHelper}>
                  Mettlo 18 yaş ve üzeri içindir. 18 yaşından küçükler yalnızca ebeveyn / yasal vasi kaydı ile üye olabilir.
                </MettloText>
                {birthError ? <MettloText style={styles.errorText}>{birthError}</MettloText> : null}
              </View>

              {/* Consent */}
              <View style={styles.consentsWrap}>
                <ConsentRow
                  checked={terms}
                  onCheckboxPress={handleTermsCheckbox}
                  onLinkPress={() => setShowTermsModal(true)}
                  linkText="Kullanım Koşulları"
                  suffix="'nı okudum, anladım ve kabul ediyorum."
                  showError={submitted && !terms}
                />
                <MettloText style={styles.consentHint}>
                  📖 <MettloText onPress={() => setShowTermsModal(true)} style={styles.consentLink}>Metni aç ve oku</MettloText>
                </MettloText>

                <View style={{ marginTop: Space.s8 }}>
                  <ConsentRow
                    checked={kvkk}
                    onCheckboxPress={handleKvkkCheckbox}
                    onLinkPress={() => setShowKvkkModal(true)}
                    linkText="KVKK Aydınlatma Metni"
                    suffix="'ni okudum ve anladım."
                    showError={submitted && !kvkk}
                  />
                  <MettloText style={styles.consentHint}>
                    📖 <MettloText onPress={() => setShowKvkkModal(true)} style={styles.consentLink}>Metni aç ve oku</MettloText>
                  </MettloText>
                </View>

                <MettloText style={styles.consentNote}>
                  Kutucuklar elle işaretlenemez. Her iki metni de açın, en alta kadar okuyup "Okudum, anladım, kabul ediyorum" düğmesine basın; kutucuklar otomatik işaretlenecektir.
                </MettloText>
              </View>

              <MettloButton label="Hesap Oluştur" onPress={handleRegister} loading={loading} fullWidth size="lg" />
            </View>

            {/* Divider — veya sosyal hesapla */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <MettloText variant="caption" color={Colors.textMuted}>veya sosyal hesapla</MettloText>
              <View style={styles.dividerLine} />
            </View>

            {/* Sosyal kayıt: Apple üstte, Google altta */}
            <View style={styles.socialWrap}>
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.75}
                onPress={() => Linking.openURL('https://mettlo.tr/auth/social/apple/start')}
              >
                <AppleIcon />
                <MettloText style={styles.socialBtnText}>Apple ile kayıt ol</MettloText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.75}
                onPress={() => Linking.openURL('https://mettlo.tr/auth/social/google/start')}
              >
                <GoogleIcon />
                <MettloText style={styles.socialBtnText}>Google ile kayıt ol</MettloText>
              </TouchableOpacity>
            </View>

            {/* Alt divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <MettloText variant="caption" color={Colors.textMuted} style={{ letterSpacing: 0.4 }}>
                VEYA KULLANICI ADINLA
              </MettloText>
              <View style={styles.dividerLine} />
            </View>

            {/* Login linki */}
            <View style={styles.loginRow}>
              <MettloText variant="bodySm" color={Colors.textSecondary}>Zaten hesabın var mı?</MettloText>
              <Pressable onPress={() => nav.navigate('Login')} hitSlop={8}>
                <MettloText variant="bodySm" color={Colors.secondary} style={styles.linkText}> Giriş Yap</MettloText>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modaller */}
      <LegalConsentModal
        type="terms"
        visible={showTermsModal}
        onAccept={() => setTerms(true)}
        onClose={() => setShowTermsModal(false)}
      />
      <LegalConsentModal
        type="kvkk"
        visible={showKvkkModal}
        onAccept={() => setKvkk(true)}
        onClose={() => setShowKvkkModal(false)}
      />
      <DatePickerModal
        visible={showDatePicker}
        value={birthDate}
        onConfirm={(d) => setBirthDate(d)}
        onClose={() => setShowDatePicker(false)}
        maxDate={maxBirth}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { flexGrow: 1, paddingHorizontal: Space.s20, paddingTop: Space.s16, paddingBottom: Space.s32, gap: Space.s16 },
  backBtn: { alignSelf: 'flex-start' },
  card: {
    backgroundColor: Colors.surface1,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Space.s24,
    gap: Space.s20,
  },
  cardHeader: { gap: Space.s6 },
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: Radius.md, padding: Space.s12,
  },
  form: { gap: Space.s16 },
  fieldWrap: { gap: Space.s6 },
  fieldLabel: { ...Typography.bodySm, color: Colors.textSecondary, fontWeight: '500' },
  hint: { fontSize: 12, lineHeight: 18 },
  errorText: { fontSize: 12, color: Colors.error },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.md + 1,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  phoneRowError: { borderColor: Colors.error },
  phonePrefix: {
    backgroundColor: Colors.surface3,
    paddingHorizontal: Space.s12, height: 50,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: Colors.borderSubtle,
  },
  phonePrefixText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  phoneInput: {
    flex: 1, height: 50,
    paddingHorizontal: Space.s16,
    color: Colors.textPrimary, fontSize: 15,
    backgroundColor: Colors.surface2,
  },
  dateTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface2,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.md, paddingHorizontal: Space.s16, height: 50,
  },
  dateTriggerError: { borderColor: Colors.error },
  dateHelper: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  consentsWrap: { gap: Space.s4 },
  consentHint: { fontSize: 13, color: Colors.secondary, marginLeft: Space.s32 },
  consentLink: { color: Colors.secondary, fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  consentNote: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginTop: Space.s8 },
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
  socialBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontWeight: '700' },
});
