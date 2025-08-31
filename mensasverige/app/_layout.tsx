import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useState } from 'react';
import useStore from '@/features/common/store/store';
import apiClient from '@/features/common/services/apiClient';
import useUserLocation from '@/features/map/hooks/useUserLocation';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { backendConnection, setBackendConnection, user, setUser } = useStore();
  const [checkingBackendConnection, setCheckingBackendConnection] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    console.log('User state changed:', user);
    setIsLoggedIn(!!user);
    console.log('Is logged in:', isLoggedIn);
  }, [user]);

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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
