import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './navigation';
import { registerForPushNotifications, navigateFromNotification } from './services/notificationService';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function NotificationBootstrap() {
  const authStatus = useAuthStore(s => s.status);
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    registerForPushNotifications().catch(() => {});

    notifListener.current = Notifications.addNotificationReceivedListener(n => {
      console.log('[Push] Bildirim alındı:', n.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      navigateFromNotification(response.notification);
    });

    // Uygulama kapalıyken tıklanan bildirim
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      setTimeout(() => navigateFromNotification(response.notification), 800);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [authStatus]);

  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Temel koyu arka plan */}
      <LinearGradient
        colors={['#0B1220', '#0B1220', '#0C1018']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.root}
      >
        {/* Web auth-wrap::before — sol üst pembe parıltı */}
        <LinearGradient
          colors={['rgba(236,72,153,0.14)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.55 }}
          style={styles.overlay}
          pointerEvents="none"
        />
        {/* Web auth-wrap::before — sağ alt turuncu parıltı */}
        <LinearGradient
          colors={['transparent', 'rgba(249,115,22,0.22)']}
          start={{ x: 0.3, y: 0.4 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.overlay}
          pointerEvents="none"
        />
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" />
            <AppNavigator />
            <NotificationBootstrap />
          </QueryClientProvider>
        </SafeAreaProvider>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
