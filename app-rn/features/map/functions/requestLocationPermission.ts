import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    )
      .then(granted => {
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      })
      .catch(error => {
        console.warn(error);
        return false;
      });
  } else if (Platform.OS === 'ios') {
    return new Promise((resolve, _) => {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
      });

      Geolocation.requestAuthorization();

      // Use getCurrentPosition to check if permission is granted
      Geolocation.getCurrentPosition(
        () => resolve(true), // Permission is granted
        () => resolve(false), // Permission is denied
        {enableHighAccuracy: true, timeout: 5000, maximumAge: 10000},
      );
    });
  }
  console.warn(
    'Platform not recognized, unable to request location permissions. Wing it and go for true! YOLO!',
  );
  return Promise.resolve(true);
};
