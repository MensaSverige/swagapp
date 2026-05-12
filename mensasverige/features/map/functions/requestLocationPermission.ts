import * as Location from 'expo-location';

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn(error);
    return false;
  }
};

export const requestBackgroundLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn(error);
    return false;
  }
};
