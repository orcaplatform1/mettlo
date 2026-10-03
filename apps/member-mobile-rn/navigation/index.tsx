import React, { useEffect } from 'react';
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
import { BusinessDetailScreen } from '../screens/business/BusinessDetailScreen';
import { ConversationScreen } from '../screens/messages/ConversationScreen';
import { ReservationsScreen } from '../screens/profile/ReservationsScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { BlocksScreen } from '../screens/profile/BlocksScreen';
// Notifications / Support / Advertising / Events / Jobs
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { SupportScreen } from '../screens/support/SupportScreen';
import { SupportDetailScreen } from '../screens/support/SupportDetailScreen';
import { SupportNewScreen } from '../screens/support/SupportNewScreen';
import { AdvertisingScreen } from '../screens/advertising/AdvertisingScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { JobApplicationsScreen } from '../screens/jobs/JobApplicationsScreen';
import { EarningsScreen } from '../screens/earnings/EarningsScreen';
// Sports
import { SportsScreen } from '../screens/sports/SportsScreen';
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
import { AdminBranchesScreen } from '../screens/admin/AdminBranchesScreen';
import { AdminCareersScreen } from '../screens/admin/AdminCareersScreen';
import { AdminContactScreen } from '../screens/admin/AdminContactScreen';
import { AdminEventsScreen } from '../screens/admin/AdminEventsScreen';
import { AdminJobsScreen } from '../screens/admin/AdminJobsScreen';
import { AdminPayoutsScreen } from '../screens/admin/AdminPayoutsScreen';
import { AdminRolesScreen } from '../screens/admin/AdminRolesScreen';
import { AdminStoriesScreen } from '../screens/admin/AdminStoriesScreen';
import { AdminSubCategoriesScreen } from '../screens/admin/AdminSubCategoriesScreen';
import { AdminCommissionScreen } from '../screens/admin/AdminCommissionScreen';
import { AdminFeaturesScreen } from '../screens/admin/AdminFeaturesScreen';
// Creator / Koç screens
import { CreatorDashboardScreen } from '../screens/creator/CreatorDashboardScreen';
import { CreatorClientsScreen } from '../screens/creator/CreatorClientsScreen';
import { CreatorEarningsScreen } from '../screens/creator/CreatorEarningsScreen';
import { CreatorProgramsScreen } from '../screens/creator/CreatorProgramsScreen';
import { CreatorSettingsScreen } from '../screens/creator/CreatorSettingsScreen';
import { CreatorPlansScreen } from '../screens/creator/CreatorPlansScreen';
import { CreatorInvitesScreen } from '../screens/creator/CreatorInvitesScreen';
import { CreatorSubscribersScreen } from '../screens/creator/CreatorSubscribersScreen';
import { RecipeDetailScreen } from '../screens/nutrition/RecipeDetailScreen';

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
  BusinessDetail: { slug: string };
  Conversation: { conversationId: string; otherName?: string; otherUsername?: string; otherAvatarUrl?: string; otherRole?: string };
  RecipeDetail: { slug: string };
  LiveDetail: { slug: string };
  Reservations: undefined;
  Favorites: undefined;
  Settings: undefined;
  Blocks: undefined;
  // Notifications / Support / Advertising / Events / Jobs
  Notifications: undefined;
  Support: undefined;
  SupportDetail: { ticketId: string };
  SupportNew: undefined;
  Advertising: undefined;
  Events: undefined;
  JobApplications: undefined;
  Earnings: undefined;
  // Sports
  Sports: { branch: string };
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
  AdminBranches: undefined;
  AdminCareers: undefined;
  AdminContact: undefined;
  AdminEvents: undefined;
  AdminJobs: undefined;
  AdminPayouts: undefined;
  AdminRoles: undefined;
  AdminStories: undefined;
  AdminSubCategories: undefined;
  AdminCommission: undefined;
  AdminFeatures: undefined;
  // Creator / Koç
  CreatorDashboard: undefined;
  CreatorClients: undefined;
  CreatorEarnings: undefined;
  CreatorPrograms: undefined;
  CreatorSettings: undefined;
  CreatorPlans: undefined;
  CreatorInvites: undefined;
  CreatorSubscribers: undefined;
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
            <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Conversation" component={ConversationScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="LiveDetail" component={LiveScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Reservations" component={ReservationsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Blocks" component={BlocksScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Explore" component={ExploreScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Programs" component={ProgramsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ presentation: 'card' }} />
            {/* Notifications / Support / Advertising / Events / Jobs */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Support" component={SupportScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="SupportDetail" component={SupportDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="SupportNew" component={SupportNewScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Advertising" component={AdvertisingScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Events" component={EventsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="JobApplications" component={JobApplicationsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Earnings" component={EarningsScreen} options={{ presentation: 'card' }} />
            {/* Sports (koşu, boks, yoga, pilates, hiit, meditasyon, dans) */}
            <Stack.Screen name="Sports" component={SportsScreen} options={{ presentation: 'card' }} />
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
            <Stack.Screen name="AdminBranches" component={AdminBranchesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminCareers" component={AdminCareersScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminContact" component={AdminContactScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminJobs" component={AdminJobsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminPayouts" component={AdminPayoutsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminRoles" component={AdminRolesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminStories" component={AdminStoriesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminSubCategories" component={AdminSubCategoriesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminCommission" component={AdminCommissionScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="AdminFeatures" component={AdminFeaturesScreen} options={{ presentation: 'card' }} />
            {/* Creator / Koç */}
            <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorClients" component={CreatorClientsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorEarnings" component={CreatorEarningsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorPrograms" component={CreatorProgramsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorSettings" component={CreatorSettingsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorPlans" component={CreatorPlansScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorInvites" component={CreatorInvitesScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatorSubscribers" component={CreatorSubscribersScreen} options={{ presentation: 'card' }} />
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
