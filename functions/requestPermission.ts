import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';


export const requestLocationPermission = async () =>{
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
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
  }