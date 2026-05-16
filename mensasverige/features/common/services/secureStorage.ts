import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PREFIX = 'swag_';

// On web, the refresh token lives in an httpOnly cookie set by the server.
// Storing it in localStorage would expose it to XSS, so we skip it entirely.
// All other keys (accessToken, accessTokenExpiry, credentials) stay in
// localStorage on web so the rest of the auth flow is unchanged.
const WEB_COOKIE_KEYS = new Set(['refreshToken']);

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (WEB_COOKIE_KEYS.has(key)) return;
    localStorage.setItem(PREFIX + key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (WEB_COOKIE_KEYS.has(key)) return null;
    return localStorage.getItem(PREFIX + key);
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (WEB_COOKIE_KEYS.has(key)) return;
    localStorage.removeItem(PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
