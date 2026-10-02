import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Space, BOTTOM_TAB_H } from '../constants/tokens';
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
  colors: { ...DefaultTheme.colors, background: Colors.bg, card: Colors.surface1, text: Colors.textPrimary, border: Colors.borderSubtle, primary: Colors.primary, notification: Colors.error },
};

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const icons: Record<string, [string, string]> = {
    Home: ['⌂', '⌂'],
    Explore: ['◎', '◎'],
    Programs: ['▶', '▶'],
    Messages: ['✉', '✉'],
    Profile: ['◉', '◉'],
  };
  const [icon] = icons[name] ?? ['●', '●'];
  return (
    <Text style={{ fontSize: 22, color: active ? Colors.primary : Colors.textMuted }}>{icon}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} active={focused} />,
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
    <View style={styles.splash}>
      <Text style={styles.splashLogo}>METTLO</Text>
      <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: Space.s24 }} />
    </View>
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
    height: BOTTOM_TAB_H + 16,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  splashLogo: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 8 },
});
