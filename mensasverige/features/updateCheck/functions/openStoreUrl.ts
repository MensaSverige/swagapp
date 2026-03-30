import { Linking } from 'react-native';

export const openStoreUrl = (storeUrl?: string): void => {
  if (!storeUrl) return;

  Linking.openURL(storeUrl).catch((err) => {
    console.error('Failed to open store URL:', err);
  });
};
