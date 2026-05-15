import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PREFIX = 'swag_';

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(PREFIX + key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(PREFIX + key);
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
