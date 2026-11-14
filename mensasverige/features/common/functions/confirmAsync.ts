import { Alert, Platform } from 'react-native';

/**
 * Ask the user to confirm an action. Resolves true when they confirm.
 *
 * Alert.alert with buttons does nothing on react-native-web, so the web build
 * uses the browser's own confirm dialog instead.
 */
export const confirmAsync = (title: string, message: string, confirmLabel: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
  }
  return new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Avbryt', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
};
