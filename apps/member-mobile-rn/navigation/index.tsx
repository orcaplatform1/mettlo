import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space } from '../constants/tokens';
import { absUrl } from '../services/api';
import { NavIcon } from '../components/ui/NavIcon';
import { useAuthStore } from '../store/authStore';

// Auth
import { HomeScreen } from '../screens/home/HomeScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { ProgramsScreen } from '../screens/programs/ProgramsScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
// Detail screens
import { CoachDetailScreen } from '../screens/coaches/CoachDetailScreen';
import { ProgramDetailScreen } from '../screens/programs/ProgramDetailScreen';
import { ChallengesScreen } from '../screens/challenges/ChallengesScreen';
import { ChallengeDetailScreen } from '../screens/challenges/ChallengeDetailScreen';
import { LiveScreen } from '../screens/live/LiveScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { CommunityDetailScreen } from '../screens/community/CommunityDetailScreen';
import { HealthScreen } from '../screens/health/HealthScreen';
import { NutritionScreen } from '../screens/nutrition/NutritionScreen';
import { StoreScreen } from '../screens/store/StoreScreen';
import { PricingScreen } from '../screens/pricing/PricingScreen';
import { BusinessListScreen } from '../screens/business/BusinessListScreen';
import { ReservationsScreen } from '../screens/profile/ReservationsScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
// Admin screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminUserDetailScreen } from '../screens/admin/AdminUserDetailScreen';
import { AdminCoachesScreen } from '../screens/admin/AdminCoachesScreen';
import { AdminTicketsScreen } from '../screens/admin/AdminTicketsScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminReviewsScreen } from '../screens/admin/AdminReviewsScreen';
import { AdminPaymentsScreen } from '../screens/admin/AdminPaymentsScreen';
import { AdminAuditScreen } from '../screens/admin/AdminAuditScreen';
import { AdminStoreScreen } from '../screens/admin/AdminStoreScreen';
import { AdminBusinessesScreen } from '../screens/admin/AdminBusinessesScreen';
import { AdminAdsScreen } from '../screens/admin/AdminAdsScreen';
// Creator screens
import { CreatorDashboardScreen } from '../screens/creator/CreatorDashboardScreen';
import { CreatorClientsScreen } from '../screens/creator/CreatorClientsScreen';
import { CreatorEarningsScreen } from '../screens/creator/CreatorEarningsScreen';
import { CreatorProgramsScreen } from '../screens/creator/CreatorProgramsScreen';
import { CreatorSettingsScreen } from '../screens/creator/CreatorSettingsScreen';

export type RootStackParamList = {
  Tabs: { screen?: keyof TabParamList } | undefined;
  Login: undefined;
  Register: undefined;
  Explore: undefined;
  Programs: undefined;
  Messages: undefined;
  CoachDetail: { username: string };
  ProgramDetail: { slug: string };
  ChallengeDetail: { slug: string };
  Challenges: undefined;
  Live: undefined;
  Community: undefined;
  CommunityDetail: { slug: string };
  Health: undefined;
  Nutrition: undefined;
  Store: undefined;
  Pricing: undefined;
  BusinessList: { category?: string } | undefined;
  Reservations: undefined;
  Favorites: undefined;
  Settings: undefined;
  // Admin
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminUserDetail: { userId: string };
  AdminCoaches: { filter?: string } | undefined;
  AdminTickets: { filter?: string } | undefined;
  AdminReports: undefined;
  AdminReviews: undefined;
  AdminPayments: undefined;
  AdminAudit: undefined;
  AdminStore: undefined;
  AdminBusinesses: undefined;
  AdminAds: undefined;
  // Creator / Koç
  CreatorDashboard: undefined;
  CreatorClients: undefined;
  CreatorEarnings: undefined;
  CreatorPrograms: undefined;
  CreatorSettings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Programs: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const MettloTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent', card: Colors.surface1, text: Colors.textPrimary, border: Colors.borderSubtle, primary: Colors.primary, notification: Colors.error },
};

function ProfileTabIcon({ active }: { active: boolean }) {
  const avatarUrl = absUrl(useAuthStore((s) => (s.user as any)?.avatarUrl));
  if (avatarUrl) {
    return (
      <View style={[tabAvatarStyles.wrap, active && tabAvatarStyles.wrapActive]}>
        <Image source={{ uri: avatarUrl }} style={tabAvatarStyles.img} />
      </View>
    );
  }
  return <NavIcon name="Profile" active={active} size={28} />;
}

const tabAvatarStyles = StyleSheet.create({
  wrap: { width: 30, height: 30, borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  wrapActive: { borderColor: Colors.primary },
  img: { width: '100%', height: '100%' },
});

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 52 + insets.bottom;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { ...styles.tabBar, height: tabBarHeight, paddingBottom: insets.bottom > 0 ? insets.bottom : 8 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused }) => {
          if (route.name === 'Profile') return <ProfileTabIcon active={focused} />;
          return <NavIcon name={route.name as 'Home' | 'Explore' | 'Programs' | 'Messages'} active={focused} size={28} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Keşfet' }} />
      <Tab.Screen name="Programs" component={ProgramsScreen} options={{ title: 'Programlar' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlar' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <LinearGradient colors={['#0B1220', '#0E0D1F', '#1A0B12']} style={styles.splash}>
      <Image source={require('../assets/icon.png')} style={styles.splashIcon} resizeMode="contain" />
      <Text style={styles.splashLogo}>METTLO</Text>
      <LinearGradient colors={['#F97316', '#FB7185', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.splashBar} />
      <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: Space.s32 }} />
    </LinearGradient>
  );
}

export function AppNavigator() {
  const { status, loadSession } = useAuthStore();

  useEffect(() => { loadSession(); }, []);

  if (status === 'unknown') return <SplashScreen />;

  return (
    <NavigationContainer ref={navigationRef} theme={MettloTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'unauthenticated' ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} />
            {/* Detail */}
            <Stack.Screen name="CoachDetail" component={CoachDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Live" component={LiveScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Community" component={CommunityScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Health" component={HealthScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Store" component={StoreScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Pricing" component={PricingScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="BusinessList" component={BusinessListScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Reservations" component={ReservationsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Explore" component={ExploreScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Programs" component={ProgramsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ presentation: 'card' }} />
            {/* Admin */}
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminCoaches" component={AdminCoachesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminTickets" component={AdminTicketsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminAudit" component={AdminAuditScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminStore" component={AdminStoreScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminBusinesses" component={AdminBusinessesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminAds" component={AdminAdsScreen} options={{ presentation: 'card' }} />
            {/* Creator / Koç */}
            <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorClients" component={CreatorClientsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorEarnings" component={CreatorEarningsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorPrograms" component={CreatorProgramsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorSettings" component={CreatorSettingsScreen} options={{ presentation: 'card' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: Colors.surface1, borderTopColor: Colors.borderSubtle, borderTopWidth: 1, paddingTop: 8 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashIcon: { width: 72, height: 72, marginBottom: Space.s16 },
  splashLogo: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 8 },
  splashBar: { width: 48, height: 3, borderRadius: 99, marginTop: Space.s8 },
});
