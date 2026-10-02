import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem { icon: string; label: string; onPress: () => void; badge?: string }

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const menuItems: MenuItem[] = [
    { icon: '📋', label: 'Programlarım', onPress: () => nav.navigate('Programs') },
    { icon: '📅', label: 'Rezervasyonlarım', onPress: () => {} },
    { icon: '🏆', label: 'Challenge\'larım', onPress: () => nav.navigate('Challenges') },
    { icon: '❤️', label: 'Favorilerim', onPress: () => {} },
    { icon: '🛒', label: 'Siparişlerim', onPress: () => nav.navigate('Store') },
    { icon: '💳', label: 'Aboneliğim & Fiyatlar', onPress: () => nav.navigate('Pricing') },
    { icon: '❤️‍🩹', label: 'Sağlık Takibi', onPress: () => nav.navigate('Health') },
    { icon: '🥗', label: 'Tarifler', onPress: () => nav.navigate('Nutrition') },
    { icon: '🏢', label: 'İşletmeler', onPress: () => nav.navigate('BusinessList', {}) },
    { icon: '⚙️', label: 'Ayarlar', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#0D0B1F', '#110928', Colors.bg]} style={styles.header}>
          <View style={styles.avatarRow}>
            <MettloAvatar uri={user.avatarUrl} name={user.name} size={80} verified={user.isCoach} />
            <View style={styles.userInfo}>
              <MettloText variant="h3">{user.name}</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}>@{user.username}</MettloText>
              <View style={styles.badges}>
                {user.isPremium && <MettloBadge label="⭐ Premium" variant="gradient" />}
                {user.isCoach && <MettloBadge label="Koç" variant="verified" />}
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <MettloText variant="h4" color={Colors.highlight}>⚡ {user.xp ?? 0}</MettloText>
              <MettloText variant="caption" color={Colors.textMuted}>XP</MettloText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MettloText variant="h4" color={Colors.primary}>🔥 {user.streakDays ?? 0}</MettloText>
              <MettloText variant="caption" color={Colors.textMuted}>Streak</MettloText>
            </View>
          </View>
        </LinearGradient>

        {/* Premium CTA */}
        {!user.isPremium && (
          <Pressable style={styles.premiumBanner} onPress={() => nav.navigate('Pricing')}>
            <LinearGradient colors={['rgba(249,115,22,0.15)', 'rgba(236,72,153,0.10)']} style={styles.premiumBannerInner}>
              <MettloText variant="h5">⭐ Premium'a Geç</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}>Tüm özelliklere eriş →</MettloText>
            </LinearGradient>
          </Pressable>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <Pressable key={item.label} onPress={item.onPress} style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}>
              <MettloText style={styles.menuIcon}>{item.icon}</MettloText>
              <MettloText variant="body" style={styles.menuLabel}>{item.label}</MettloText>
              <MettloText color={Colors.textMuted}>›</MettloText>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.logoutWrap}>
          <MettloButton label="Çıkış Yap" variant="danger" onPress={logout} fullWidth />
        </View>

        <View style={{ height: Space.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: Space.s20, paddingHorizontal: Space.s20, paddingBottom: Space.s24, gap: Space.s20 },
  avatarRow: { flexDirection: 'row', gap: Space.s16, alignItems: 'flex-start' },
  userInfo: { flex: 1, gap: Space.s6 },
  badges: { flexDirection: 'row', gap: Space.s8, marginTop: Space.s4 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', gap: Space.s2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.borderSubtle },
  premiumBanner: { marginHorizontal: Space.s16, marginBottom: Space.s8, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  premiumBannerInner: { padding: Space.s14, gap: Space.s4 },
  menuSection: { marginTop: Space.s8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s20, paddingVertical: Space.s16, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s14 },
  menuIcon: { fontSize: 22, width: 30 },
  menuLabel: { flex: 1 },
  logoutWrap: { paddingHorizontal: Space.s20, paddingTop: Space.s20 },
});
