import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { updateUserLocation } from '../services/locationService';
import { UserLocation } from '../../../api_schema/types';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

type BackgroundLocationData = { locations: Location.LocationObject[] };

TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }: TaskManager.TaskManagerTaskBody<BackgroundLocationData>) => {
    if (error) {
      console.warn('[BackgroundLocation] Task error:', error);
      return;
    }
    if (!data) return;
    const latest = data.locations[data.locations.length - 1];
    if (!latest) return;
    const { latitude, longitude, accuracy } = latest.coords;
    console.log('[BackgroundLocation] Task fired:', { latitude, longitude, accuracy });
    const payload: UserLocation = {
      latitude,
      longitude,
      timestamp: new Date(latest.timestamp).toISOString(),
      accuracy: accuracy ?? 0,
    };
    try {
      await updateUserLocation(payload);
    } catch (e) {
      console.warn('[BackgroundLocation] Failed to update location:', e);
    }
  },
);

export const startBackgroundLocationTask = async (timeInterval: number): Promise<void> => {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  console.log('[BackgroundLocation] Starting task, interval:', timeInterval);
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval,
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Mensa Sverige',
      notificationBody: 'Platsdelning är aktiv i bakgrunden',
    },
  });
  console.log('[BackgroundLocation] Task started successfully');
};

export const stopBackgroundLocationTask = async (): Promise<void> => {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
};
