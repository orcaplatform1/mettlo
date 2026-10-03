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
import { absUrl } from '../../services/api';
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
        { icon: '💸', label: 'Ödeme Talepleri', onPress: () => nav.navigate('AdminPayouts') },
        { icon: '🛒', label: 'Mağaza', onPress: () => nav.navigate('AdminStore') },
        { icon: '🏢', label: 'İşletmeler', onPress: () => nav.navigate('AdminBusinesses') },
        { icon: '📢', label: 'Reklamlar', onPress: () => nav.navigate('AdminAds') },
        { icon: '🎪', label: 'Etkinlikler', onPress: () => nav.navigate('AdminEvents') },
        { icon: '👔', label: 'İş İlanları', onPress: () => nav.navigate('AdminJobs') },
        { icon: '💼', label: 'Kariyer Başvuruları', onPress: () => nav.navigate('AdminCareers') },
        { icon: '📬', label: 'İletişim Mesajları', onPress: () => nav.navigate('AdminContact') },
        { icon: '👮', label: 'Roller & Yetkiler', onPress: () => nav.navigate('AdminRoles') },
        { icon: '📸', label: 'Hikâyeler', onPress: () => nav.navigate('AdminStories') },
        { icon: '🌿', label: 'Spor Branşları', onPress: () => nav.navigate('AdminBranches') },
        { icon: '🏷️', label: 'Alt Kategoriler', onPress: () => nav.navigate('AdminSubCategories') },
        { icon: '💹', label: 'Komisyon Ayarları', onPress: () => nav.navigate('AdminCommission') },
        { icon: '🔧', label: 'Platform Özellikleri', onPress: () => nav.navigate('AdminFeatures') },
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
      { icon: '🔔', label: 'Bildirimler', onPress: () => nav.navigate('Notifications') },
      { icon: '🎫', label: 'Destek', onPress: () => nav.navigate('Support') },
      { icon: '💰', label: 'Kazançlarım', onPress: () => nav.navigate('Earnings') },
      { icon: '🎟️', label: 'Etkinliklerim', onPress: () => nav.navigate('Events') },
      { icon: '📢', label: 'Reklamlarım', onPress: () => nav.navigate('Advertising') },
      { icon: '📋', label: 'Programlarım', onPress: () => nav.navigate('Programs') },
      { icon: '📅', label: 'Rezervasyonlarım', onPress: () => nav.navigate('Reservations') },
      { icon: '🏆', label: 'Challenge\'larım', onPress: () => nav.navigate('Challenges') },
      { icon: '❤️', label: 'Favorilerim', onPress: () => nav.navigate('Favorites') },
      { icon: '🛒', label: 'Siparişlerim', onPress: () => nav.navigate('Store') },
      { icon: '💼', label: 'İş Başvurularım', onPress: () => nav.navigate('JobApplications') },
      { icon: '🚫', label: 'Engellenenler', onPress: () => nav.navigate('Blocks') },
      { icon: '💳', label: 'Aboneliğim & Fiyatlar', onPress: () => nav.navigate('Pricing') },
    ],
  });

  sections.push({
    title: 'Spor Aktiviteleri',
    items: [
      { icon: '🏃', label: 'Koşu Günlüğüm', onPress: () => nav.navigate('Sports', { branch: 'running' }) },
      { icon: '🥊', label: 'Boks & Kickboks', onPress: () => nav.navigate('Sports', { branch: 'boxing' }) },
      { icon: '🧘', label: 'Yoga', onPress: () => nav.navigate('Sports', { branch: 'yoga' }) },
      { icon: '💪', label: 'Pilates', onPress: () => nav.navigate('Sports', { branch: 'pilates' }) },
      { icon: '⚡', label: 'HIIT', onPress: () => nav.navigate('Sports', { branch: 'hiit' }) },
      { icon: '🧠', label: 'Meditasyon', onPress: () => nav.navigate('Sports', { branch: 'meditation' }) },
      { icon: '💃', label: 'Dans', onPress: () => nav.navigate('Sports', { branch: 'dance' }) },
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
            {/* Sol: bilgiler */}
            <View style={styles.userInfo}>
              <MettloText variant="h3">{user.name}</MettloText>
              <MettloText variant="bodySm" color={Colors.textMuted}>@{user.username}</MettloText>
              <View style={styles.badges}>
                {user.isPremium && <MettloBadge label="⭐ Premium" variant="gradient" />}
                {isAdmin && <MettloBadge label={adminBadgeLabel} variant="error" />}
                {isCoachRole && !isAdmin && <MettloBadge label="Koç" variant="verified" />}
                {isBusiness && <MettloBadge label="İşletme" variant="primary" />}
              </View>
              <View style={styles.statsInline}>
                <MettloText style={styles.statInlineText} color={Colors.highlight}>⚡ {user.xp ?? 0} XP</MettloText>
                <MettloText style={styles.statInlineText} color={Colors.primary}>🔥 {user.streakDays ?? 0} Streak</MettloText>
              </View>
            </View>
            {/* Sağ: profil fotoğrafı + ayarlar */}
            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={() => nav.navigate('Settings')} style={styles.settingsBtn} hitSlop={8}>
                <MettloText style={styles.settingsIcon}>⚙️</MettloText>
              </TouchableOpacity>
              <MettloAvatar uri={absUrl(user.avatarUrl)} name={user.name} size={84} verified={user.isCoach} />
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
  header: { paddingTop: Space.s20, paddingHorizontal: Space.s20, paddingBottom: Space.s24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { flex: 1, gap: Space.s6, paddingRight: Space.s16 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8, marginTop: Space.s4 },
  statsInline: { flexDirection: 'row', gap: Space.s14, marginTop: Space.s8 },
  statInlineText: { fontSize: 13, fontWeight: '600' },
  avatarWrap: { alignItems: 'center', gap: Space.s8 },
  settingsBtn: { padding: Space.s4 },
  settingsIcon: { fontSize: 22 },
  premiumBanner: { marginHorizontal: Space.s16, marginBottom: Space.s8, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  premiumBannerInner: { padding: Space.s14, gap: Space.s4 },
  section: { marginTop: Space.s16 },
  sectionTitle: { paddingHorizontal: Space.s20, paddingBottom: Space.s8, letterSpacing: 1, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s20, paddingVertical: Space.s16, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s14 },
  menuIcon: { fontSize: 22, width: 30 },
  menuLabel: { flex: 1 },
  logoutWrap: { paddingHorizontal: Space.s20, paddingTop: Space.s20 },
});
