import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { MettloBadge } from '../../components/ui/MettloBadge';
import { MettloButton } from '../../components/ui/MettloButton';
import { MettloCopyright } from '../../components/ui/MettloCopyright';
import { Colors, Radius, Space } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem { icon: string; label: string; onPress: () => void }
interface MenuSection { title: string; color?: string; items: MenuItem[] }

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT'];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  ADMIN: 'Admin',
  MODERATOR: 'Moderatör',
  SUPPORT: 'Destek',
};

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const role: string = ((user as any).role ?? '').toUpperCase();
  const isAdmin = ADMIN_ROLES.includes(role);
  const isCoachRole = user.isCoach || role === 'CREATOR';
  const isBusiness = role === 'BUSINESS';

  const adminBadgeLabel = ROLE_LABEL[role] ?? 'Admin';

  const sections: MenuSection[] = [];

  if (isAdmin) {
    sections.push({
      title: '🛡️ Admin Paneli',
      color: Colors.error,
      items: [
        { icon: '📊', label: 'Genel Bakış', onPress: () => nav.navigate('AdminDashboard') },
        { icon: '👥', label: 'Kullanıcılar', onPress: () => nav.navigate('AdminUsers') },
        { icon: '✅', label: 'Koç Onayları', onPress: () => nav.navigate('AdminCoaches', { filter: 'PENDING' }) },
        { icon: '🚩', label: 'Şikâyetler', onPress: () => nav.navigate('AdminReports') },
        { icon: '🎫', label: 'Destek Biletleri', onPress: () => nav.navigate('AdminTickets', { filter: 'OPEN' }) },
        { icon: '⭐', label: 'Değerlendirmeler', onPress: () => nav.navigate('AdminReviews') },
        { icon: '💳', label: 'Ödemeler & Finans', onPress: () => nav.navigate('AdminPayments') },
        { icon: '🛒', label: 'Mağaza', onPress: () => nav.navigate('AdminStore') },
        { icon: '🏢', label: 'İşletmeler', onPress: () => nav.navigate('AdminBusinesses') },
        { icon: '📢', label: 'Reklamlar', onPress: () => nav.navigate('AdminAds') },
        { icon: '📋', label: 'Denetim Logları', onPress: () => nav.navigate('AdminAudit') },
      ],
    });
  }

  if (isCoachRole) {
    sections.push({
      title: '🎯 Koç Paneli',
      color: Colors.verified,
      items: [
        { icon: '📈', label: 'Dashboard', onPress: () => nav.navigate('CreatorDashboard') },
        { icon: '👤', label: 'Danışanlarım', onPress: () => nav.navigate('CreatorClients') },
        { icon: '💰', label: 'Kazançlarım', onPress: () => nav.navigate('CreatorEarnings') },
        { icon: '📋', label: 'Programlarım', onPress: () => nav.navigate('CreatorPrograms') },
        { icon: '📡', label: 'Canlı Yayın Planla', onPress: () => nav.navigate('Live') },
        { icon: '⚙️', label: 'Koç Profil Ayarları', onPress: () => nav.navigate('CreatorSettings') },
      ],
    });
  }

  if (isBusiness) {
    sections.push({
      title: '🏢 İşletme Paneli',
      color: Colors.accent,
      items: [
        { icon: '📊', label: 'İşletme Dashboard', onPress: () => nav.navigate('BusinessList', {}) },
        { icon: '📍', label: 'İşletmelerim', onPress: () => nav.navigate('BusinessList', {}) },
        { icon: '🎯', label: 'Kampanyalarım', onPress: () => nav.navigate('BusinessList', {}) },
      ],
    });
  }

  sections.push({
    title: 'Hesabım',
    items: [
      { icon: '📋', label: 'Programlarım', onPress: () => nav.navigate('Programs') },
      { icon: '📅', label: 'Rezervasyonlarım', onPress: () => nav.navigate('Reservations') },
      { icon: '🏆', label: 'Challenge\'larım', onPress: () => nav.navigate('Challenges') },
      { icon: '❤️', label: 'Favorilerim', onPress: () => nav.navigate('Favorites') },
      { icon: '🛒', label: 'Siparişlerim', onPress: () => nav.navigate('Store') },
      { icon: '💳', label: 'Aboneliğim & Fiyatlar', onPress: () => nav.navigate('Pricing') },
    ],
  });

  sections.push({
    title: 'Keşfet',
    items: [
      { icon: '❤️‍🩹', label: 'Sağlık Takibi', onPress: () => nav.navigate('Health') },
      { icon: '🥗', label: 'Tarifler', onPress: () => nav.navigate('Nutrition') },
      { icon: '🏢', label: 'İşletmeler', onPress: () => nav.navigate('BusinessList', {}) },
      { icon: '⚙️', label: 'Ayarlar', onPress: () => nav.navigate('Settings') },
    ],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#0D0B1F', '#110928', 'transparent']} style={styles.header}>
          <View style={styles.avatarRow}>
            <MettloAvatar uri={user.avatarUrl} name={user.name} size={80} verified={user.isCoach} />
            <View style={styles.userInfo}>
              <MettloText variant="h3">{user.name}</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}>@{user.username}</MettloText>
              <View style={styles.badges}>
                {user.isPremium && <MettloBadge label="⭐ Premium" variant="gradient" />}
                {isAdmin && <MettloBadge label={adminBadgeLabel} variant="error" />}
                {isCoachRole && !isAdmin && <MettloBadge label="Koç" variant="verified" />}
                {isBusiness && <MettloBadge label="İşletme" variant="primary" />}
              </View>
            </View>
          </View>

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

        {!user.isPremium && (
          <TouchableOpacity activeOpacity={0.75} style={styles.premiumBanner} onPress={() => nav.navigate('Pricing')}>
            <LinearGradient colors={['rgba(249,115,22,0.15)', 'rgba(236,72,153,0.10)']} style={styles.premiumBannerInner}>
              <MettloText variant="h5">⭐ Premium'a Geç</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}>Tüm özelliklere eriş →</MettloText>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <MettloText variant="caption" color={section.color ?? Colors.textMuted} style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </MettloText>
            {section.items.map((item) => (
              <TouchableOpacity key={item.label} onPress={item.onPress} activeOpacity={0.7} style={styles.menuItem}>
                <MettloText style={styles.menuIcon}>{item.icon}</MettloText>
                <MettloText variant="body" style={styles.menuLabel}>{item.label}</MettloText>
                <MettloText color={Colors.textMuted}>›</MettloText>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.logoutWrap}>
          <MettloButton label="Çıkış Yap" variant="danger" onPress={logout} fullWidth />
        </View>

        <MettloCopyright />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingTop: Space.s20, paddingHorizontal: Space.s20, paddingBottom: Space.s24, gap: Space.s20 },
  avatarRow: { flexDirection: 'row', gap: Space.s16, alignItems: 'flex-start' },
  userInfo: { flex: 1, gap: Space.s6 },
  badges: { flexDirection: 'row', gap: Space.s8, marginTop: Space.s4 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', gap: Space.s2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.borderSubtle },
  premiumBanner: { marginHorizontal: Space.s16, marginBottom: Space.s8, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  premiumBannerInner: { padding: Space.s14, gap: Space.s4 },
  section: { marginTop: Space.s16 },
  sectionTitle: { paddingHorizontal: Space.s20, paddingBottom: Space.s8, letterSpacing: 1, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s20, paddingVertical: Space.s16, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s14 },
  menuIcon: { fontSize: 22, width: 30 },
  menuLabel: { flex: 1 },
  logoutWrap: { paddingHorizontal: Space.s20, paddingTop: Space.s20 },
});
