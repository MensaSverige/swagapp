import useStore from '../store/store';
import Geolocation from '@react-native-community/geolocation';
import {useCallback, useEffect, useRef, useState} from 'react';
import apiClient from '../apiClient';
import {PermissionsAndroid, Platform} from 'react-native';

const LOCATION_UPDATE_INTERVAL = 1000 * 60; // 60 seconds

async function requestLocationPermission() {
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

export const useLocationController = () => {
  const user = useStore(state => state.user);
  const setUsersWithLocation = useStore(state => state.setUsersWithLocation);
  const usersWithLocation = useStore(state => state.usersWithLocation);
  const [refreshing, setRefreshing] = useState(false);

  const [locationConsumers, setLocationConsumers] = useState<string[]>([]);
  const updateIntervalRef = useRef<number | null>(null);

  const sendLocationData = useCallback(async () => {
    console.log('Checking location permission');
    requestLocationPermission().then(
      granted => {
        if (!granted) {
          console.log('Not granted');
          return;
        }
        Geolocation.getCurrentPosition(
          async position => {
            // Implement your API call here to send position data to the backend
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp,
            };
            apiClient.put('/user/me', {...user, location});
          },
          error => console.error(error),
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      },
      error => {
        console.log('error', error);
      },
    );
  }, [user]);

  const fetchUserLocations = useCallback(async () => {
    if (locationConsumers.length > 0) {
      setRefreshing(true);
      apiClient
        .get('/users_showing_location')
        .then(response => {
          if (response.status === 200) {
            setUsersWithLocation(response.data);
          }
        })
        .finally(() => {
          setRefreshing(false);
        });
    }
  }, [locationConsumers, setUsersWithLocation]);

  useEffect(() => {
    if (locationConsumers.length > 0 && !updateIntervalRef.current) {
      sendLocationData();
      updateIntervalRef.current = setInterval(() => {
        sendLocationData();
        fetchUserLocations();
      }, LOCATION_UPDATE_INTERVAL);
    } else if (locationConsumers.length === 0 && updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current as number);
      updateIntervalRef.current = null;
    }
  }, [locationConsumers, sendLocationData, fetchUserLocations]);

  const subscribe = (id: string) => {
    if (!locationConsumers.includes(id)) {
      setLocationConsumers([...locationConsumers, id]);
    }
  };

  const unsubscribe = (id: string) => {
    if (locationConsumers.includes(id)) {
      setLocationConsumers(
        locationConsumers.filter(consumer => consumer !== id),
      );
    }
  };

  return {
    subscribe,
    unsubscribe,
    usersWithLocation,
    userLocationsRefreshing: refreshing,
  };
};
