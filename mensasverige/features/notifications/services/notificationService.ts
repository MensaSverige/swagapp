import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import apiClient from '@/features/common/services/apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken(): Promise<void> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0077E6',
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'ba3ea4a2-fed7-462a-b42c-70092682f176',
    });
    await apiClient.post('/notifications/register-token', { token });
  } catch (e) {
    console.warn('Push token registration failed:', e);
  }
}
