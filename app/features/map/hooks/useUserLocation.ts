import useStore from '../../common/store/store';
import Geolocation from '@react-native-community/geolocation';
import {useEffect, useRef} from 'react';
import {
  updateUserLocation,
} from '../services/locationService';
import { UserLocation } from '../../../api_schema/types';

const useUserLocation = () => {
  const {user, locationUpdateInterval, hasLocationPermission, setUserLocation} =
    useStore();

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Make sure there is only one interval running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const fetchLocation = async () => {
      if (!user?.isMember || !hasLocationPermission) {
        return;
      }
      Geolocation.getCurrentPosition(
        position => {
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
                  accuracy: position.coords.accuracy,
              };
              updateUserLocation(locationUpdateData);
            }
          }
        },
        e => {
          //console.error('Geolocation.getCurrentPosition error: ', e);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    };

    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, locationUpdateInterval);
  }, [locationUpdateInterval, hasLocationPermission, user?.settings.show_location]);
};

export default useUserLocation;
