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
          const backgroundActive = user.settings.background_location_updates === true;
          if (user.settings.show_location !== "NO_ONE" && !backgroundActive) {
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
        console.log('Location.getCurrentPositionAsync error: ', e);
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
      console.log('[BackgroundLocation] Background permission status:', status);
      if (!hasBackground) {
        hasBackground = await requestBackgroundLocationPermission();
        console.log('[BackgroundLocation] Permission after request:', hasBackground);
      }
      if (hasBackground) {
        startBackgroundLocationTask(getLocationUpdateInterval()).catch((e) => {
          const msg = String(e);
          if (msg.includes('SharedPreferences') || msg.includes('NullPointer')) {
            console.warn('[BackgroundLocation] Native module context was GC\'d after a JS reload. Fully restart the dev client app (kill from launcher, reopen) — this is dev-build only.');
          } else {
            console.warn('[BackgroundLocation] Failed to start task:', e);
          }
        });
      } else {
        console.warn('[BackgroundLocation] Background permission not granted, task will not start');
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
