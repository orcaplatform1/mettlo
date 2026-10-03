import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { navigationRef } from '../navigation';

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) return null; // Expo Go SDK 53+ push bildirimleri desteklemiyor
  if (!Device.isDevice) return null; // Emülatörde token alınamaz

  // İzin iste
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  // Android kanal oluştur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Mettlo Bildirimleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Mesajlar',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#F97316',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('reservations', {
      name: 'Rezervasyonlar',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#10B981',
      sound: 'default',
    });
  }

  // FCM token al (native device token — Firebase tarafından kullanılır)
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    if (token) {
      await saveFcmToken(token);
      return token;
    }
  } catch (e) {
    console.warn('[Push] Token alınamadı:', e);
  }

  return null;
}

async function saveFcmToken(token: string): Promise<void> {
  try {
    await api.post('/me/fcm-token', { token });
  } catch (e) {
    console.warn('[Push] Token kaydedilemedi:', e);
  }
}

// Bildirime tıklanınca hangi ekrana gidileceğini belirle
export function navigateFromNotification(notification: Notifications.Notification): void {
  const route = resolveNotificationRoute(notification);
  if (!route || !navigationRef.isReady()) return;
  try {
    (navigationRef.navigate as any)(route.screen, route.params);
  } catch {}
}

export function resolveNotificationRoute(notification: Notifications.Notification): { screen: string; params?: any } | null {
  const data = notification.request.content.data as Record<string, any>;
  if (!data) return null;

  switch (data.type) {
    case 'message':
      return { screen: 'Messages' };
    case 'reservation':
      return { screen: 'Reservations' };
    case 'challenge':
      return data.slug ? { screen: 'ChallengeDetail', params: { slug: data.slug } } : { screen: 'Challenges' };
    case 'program':
      return data.slug ? { screen: 'ProgramDetail', params: { slug: data.slug } } : { screen: 'Programs' };
    case 'coach':
      return data.username ? { screen: 'CoachDetail', params: { username: data.username } } : null;
    case 'community':
      return data.slug ? { screen: 'CommunityDetail', params: { slug: data.slug } } : { screen: 'Community' };
    case 'ticket':
      return { screen: 'AdminTickets', params: { filter: 'OPEN' } };
    case 'report':
      return { screen: 'AdminReports' };
    case 'creator_approval':
      return { screen: 'AdminCoaches', params: { filter: 'PENDING' } };
    case 'pricing':
      return { screen: 'Pricing' };
    default:
      return null;
  }
}
