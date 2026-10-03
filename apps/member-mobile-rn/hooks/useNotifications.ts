import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { registerForPushNotifications, resolveNotificationRoute } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const isExpoGo = Constants.appOwnership === 'expo';

export function useNotifications() {
  const { status } = useAuthStore();
  const nav = useNavigation<Nav>();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (isExpoGo) return;

    registerForPushNotifications().catch(() => {});

    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Bildirim alındı:', notification.request.content.title);
    });

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

export async function getInitialNotificationRoute(): Promise<{ screen: string; params?: any } | null> {
  if (isExpoGo) return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  return resolveNotificationRoute(response.notification);
}
