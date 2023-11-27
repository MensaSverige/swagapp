import useStore from '../store/store';
import Geolocation from '@react-native-community/geolocation';
import {useEffect} from 'react';
import {
  updateUserLocation,
  LocationUpdateData,
} from '../services/locationService';

const useUserLocation = () => {
  const {
    user,
    locationUpdateInterval,
    hasLocationPermission,
    setUserLocation,
    setRegion,
    region,
  } = useStore();

  useEffect(() => {
    const fetchLocation = async () => {
      if (!hasLocationPermission) {
        return;
      }
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          if (
            user &&
            user.username != undefined &&
            latitude != undefined &&
            longitude != undefined
          ) {
            setUserLocation(latitude, longitude);
            setRegion({
              ...region,
              latitude: latitude,
              longitude: longitude,
            });
            if (user.show_location) {
              const locationUpdateData: LocationUpdateData = {
                username: user.username,
                location: {
                  latitude: latitude,
                  longitude: longitude,
                },
              };
              console.log('locationUpdateData', locationUpdateData);
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
    setInterval(fetchLocation, locationUpdateInterval);
  }, [locationUpdateInterval, setRegion, setUserLocation, user]);
};

export default useUserLocation;
