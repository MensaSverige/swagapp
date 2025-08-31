import useStore from '../../common/store/store';
import * as Location from 'expo-location';
import {useEffect, useRef} from 'react';
import {
  updateUserLocation,
} from '../services/locationService';
import { UserLocation } from '../../../api_schema/types';

const useUserLocation = () => {
  const {user, locationUpdateInterval, hasLocationPermission, setUserLocation} =
    useStore();

  const intervalRef = useRef<NodeJS.Timeout | number | undefined>(undefined);

  useEffect(() => {
    // Make sure there is only one interval running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const fetchLocation = async () => {
      if (!hasLocationPermission) {
        return;
      }
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 15000,
          distanceInterval: 10,
        });
        
        const {latitude, longitude} = position.coords;
        if (
          user &&
          user.userId !== undefined &&
          latitude !== undefined &&
          longitude !== undefined
        ) {
          setUserLocation(latitude, longitude);
          if (user.settings.show_location !== "NO_ONE") {
            const locationUpdateData: UserLocation = {
                latitude: latitude,
                longitude: longitude,
                timestamp: null,
                accuracy: position.coords.accuracy ?? 0,
            };
            updateUserLocation(locationUpdateData);
          }
        }
      } catch (e) {
        //console.error('Location.getCurrentPositionAsync error: ', e);
      }
    };

    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, locationUpdateInterval);
  }, [locationUpdateInterval, hasLocationPermission, user?.settings.show_location]);
};

export default useUserLocation;
