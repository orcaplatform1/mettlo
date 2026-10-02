import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space } from '../constants/tokens';
import { absUrl } from '../services/api';
import { NavIcon } from '../components/ui/NavIcon';
import { useAuthStore } from '../store/authStore';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { ProgramsScreen } from '../screens/programs/ProgramsScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
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

export type RootStackParamList = {
  Tabs: { screen?: keyof TabParamList } | undefined;
  Login: undefined;
  Register: undefined;
  // Tab screens accessible from stack (nested navigation)
  Explore: undefined;
  Programs: undefined;
  Messages: undefined;
  // Full screens
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
  fallback: { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
});

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 52 + insets.bottom;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: tabBarHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
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
    <NavigationContainer theme={MettloTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'unauthenticated' ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface1,
    borderTopColor: Colors.borderSubtle,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashIcon: { width: 72, height: 72, marginBottom: Space.s16 },
  splashLogo: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 8 },
  splashBar: { width: 48, height: 3, borderRadius: 99, marginTop: Space.s8 },
});
