import '@/features/map/tasks/backgroundLocationTask';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import useStore from '@/features/common/store/store';
import apiClient from '@/features/common/services/apiClient';
import useUserLocation from '@/features/map/hooks/useUserLocation';
import { UpdateRequiredModal } from '@/features/updateCheck/components/UpdateRequiredModal';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { backendConnection, setBackendConnection, user, setUser } = useStore();
  const [checkingBackendConnection, setCheckingBackendConnection] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Web: capture the URL the user intended to visit before auth redirect.
  // useRef initializer runs synchronously on first render, before Expo Router
  // has a chance to navigate away — so window.location still holds the real path.
  const intendedPath = useRef<string | null>(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? (() => {
          const p = window.location.pathname + window.location.search;
          return p && p !== '/' && p !== '/login' ? p : null;
        })()
      : null
  );
  // const [loaded] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  // });

  // if (!loaded) {
  //   // Async font loading only occurs in development.
  //   return null;
  // }

  // useEffect(() => {
  //   console.log('resetting user state');
  //   setUser(null);
  // }, []);

  useUserLocation();
  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  // Web: after login, navigate to the originally requested path if we saved one.
  useEffect(() => {
    if (Platform.OS !== 'web' || !isLoggedIn) return;
    const target = intendedPath.current;
    if (target) {
      intendedPath.current = null;
      router.replace(target as any);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (!backendConnection) {
      intervalId = setInterval(() => {
        setCheckingBackendConnection(true);
        apiClient
          .get('/health', { timeout: 200 })
          .then(() => {
            setBackendConnection(true);
          })
          .catch(error => {
            if (error.message.includes('Network Error')) {
              setBackendConnection(false);
            }
          })
          .finally(() => {
            setCheckingBackendConnection(false);
          });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [backendConnection, setBackendConnection, setCheckingBackendConnection]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <UpdateRequiredModal />
        <Stack>
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="events/[id]" options={{ headerBackTitle: 'Tillbaka' }} />
            <Stack.Screen name="events/user-events" options={{ title: 'Mina aktiviteter', headerBackTitle: 'Tillbaka' }} />
            <Stack.Screen name="profile/[userId]" options={{ title: 'Profil', headerBackTitle: 'Tillbaka' }} />
          </Stack.Protected>

          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Screen name="privacy" options={{ title: 'Integritetspolicy', headerBackTitle: 'Tillbaka' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
