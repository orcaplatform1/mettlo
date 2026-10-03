import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { registerForPushNotifications, resolveNotificationRoute } from '../services/notificationService';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// NavigationContainer içinde render edilen görünmez bileşen
export function NotificationGate() {
  const nav = useNavigation<Nav>();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // FCM token'ı backend'e kaydet
    registerForPushNotifications().catch(() => {});

    // Uygulama açıkken gelen bildirim (sadece log)
    notifListener.current = Notifications.addNotificationReceivedListener(n => {
      console.log('[Push] Bildirim:', n.request.content.title);
    });

    // Bildirime tıklanınca ilgili ekrana git
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const route = resolveNotificationRoute(response.notification);
      if (!route) return;
      try {
        (nav.navigate as any)(route.screen, route.params);
      } catch {}
    });

    // Uygulama kapalıyken tıklanan bildirimle açıldıysa
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const route = resolveNotificationRoute(response.notification);
      if (!route) return;
      // Kısa gecikme: navigator hazır olsun
      setTimeout(() => {
        try { (nav.navigate as any)(route.screen, route.params); } catch {}
      }, 500);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}
