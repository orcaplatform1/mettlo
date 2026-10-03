import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { registerForPushNotifications, resolveNotificationRoute } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useNotifications() {
  const { status } = useAuthStore();
  const nav = useNavigation<Nav>();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    // Token kaydet
    registerForPushNotifications().catch(() => {});

    // Uygulama açıkken gelen bildirim
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Bildirim handler zaten gösteriyor, buraya loglama eklenebilir
      console.log('[Push] Bildirim alındı:', notification.request.content.title);
    });

    // Bildirime tıklanınca
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const route = resolveNotificationRoute(response.notification);
      if (!route) return;
      try {
        (nav.navigate as any)(route.screen, route.params);
      } catch {}
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [status]);
}

// Uygulama kapalıyken tıklanan bildirimle açıldıysa ilk rotayı al
export async function getInitialNotificationRoute(): Promise<{ screen: string; params?: any } | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  return resolveNotificationRoute(response.notification);
}
