import useStore from '../store/store';
import Geolocation from '@react-native-community/geolocation';
import {useEffect, useRef} from 'react';
import {
  updateUserLocation,
  LocationUpdateData,
} from '../services/locationService';

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
      if (!hasLocationPermission) {
        return;
      }
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          if (
            user &&
            user.username !== undefined &&
            latitude !== undefined &&
            longitude !== undefined
          ) {
            setUserLocation(latitude, longitude);
            if (user.show_location) {
              const locationUpdateData: LocationUpdateData = {
                username: user.username,
                location: {
                  latitude: latitude,
                  longitude: longitude,
                },
              };
              updateUserLocation(locationUpdateData);
            }
          }
        },
        e => {
          console.error('Geolocation.getCurrentPosition error: ', e);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    };

    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, locationUpdateInterval);
  }, [locationUpdateInterval, hasLocationPermission, setUserLocation, user]);
};

export default useUserLocation;
