import useStore from '../../common/store/store';
import * as Location from 'expo-location';
import {useEffect, useRef} from 'react';
import {
  updateUserLocation,
} from '../services/locationService';
import { UserLocation } from '../../../api_schema/types';
import {
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
} from '../tasks/backgroundLocationTask';
import { requestBackgroundLocationPermission } from '../functions/requestLocationPermission';

const useUserLocation = () => {
  const {user, getLocationUpdateInterval, hasLocationPermission, setUserLocation, requiredUpdateInfo} =
    useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Make sure there is only one interval running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start location tracking if user is not logged in or update is required
    if (!user || requiredUpdateInfo) {
      return;
    }

    const fetchLocation = async () => {
      if (!hasLocationPermission || !user || !mountedRef.current) {
        return;
      }
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: getLocationUpdateInterval(),
          distanceInterval: 10,
        });
        
        // Check if still mounted before updating state
        if (!mountedRef.current) return;
        
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
            // Only update server if still mounted
            if (mountedRef.current) {
              updateUserLocation(locationUpdateData);
            }
          }
        }
      } catch (e) {
        //console.error('Location.getCurrentPositionAsync error: ', e);
      }
    };

    fetchLocation();
    const locationUpdateInterval = getLocationUpdateInterval();
    intervalRef.current = setInterval(() => {
      // Check if still mounted before running interval callback
      if (mountedRef.current) {
        fetchLocation();
      }
    }, locationUpdateInterval);

    // Cleanup function to clear interval when user becomes null or component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [getLocationUpdateInterval, hasLocationPermission, user?.settings.show_location, user, requiredUpdateInfo]);

  // Background location task lifecycle
  useEffect(() => {
    const shouldRunBackground =
      !!user &&
      !requiredUpdateInfo &&
      hasLocationPermission &&
      user.settings.show_location !== 'NO_ONE' &&
      user.settings.background_location_updates === true;

    if (!shouldRunBackground) {
      stopBackgroundLocationTask().catch(() => {});
      return;
    }

    const activate = async () => {
      const { status } = await Location.getBackgroundPermissionsAsync();
      let hasBackground = status === 'granted';
      if (!hasBackground) {
        hasBackground = await requestBackgroundLocationPermission();
      }
      if (hasBackground) {
        startBackgroundLocationTask(getLocationUpdateInterval()).catch(() => {});
      }
    };

    activate();
  }, [
    user,
    requiredUpdateInfo,
    hasLocationPermission,
    user?.settings?.show_location,
    user?.settings?.background_location_updates,
    getLocationUpdateInterval,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopBackgroundLocationTask().catch(() => {});
    };
  }, []);
};

export default useUserLocation;
