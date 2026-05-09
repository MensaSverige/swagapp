import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useNotifications() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const eventId = response.notification.request.content.data?.eventId as string | undefined;
      if (eventId) {
        router.push(`/(tabs)/(events)/${eventId}` as never);
      }
    });

    // Handle tap when app was fully killed
    Notifications.getLastNotificationResponseAsync().then(response => {
      const eventId = response?.notification.request.content.data?.eventId as string | undefined;
      if (eventId) {
        router.push(`/(tabs)/(events)/${eventId}` as never);
      }
    });

    return () => responseListener.current?.remove();
  }, []);
}
