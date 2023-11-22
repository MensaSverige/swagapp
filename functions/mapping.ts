import {LatLng} from 'react-native-maps';
import {EventCluster} from '../types/EventCluster';

/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * @param coord1 The first coordinate.
 * @param coord2 The second coordinate.
 * @returns The distance between the two coordinates in meters.
 */
export function getCoordinateDistance(coord1: LatLng, coord2: LatLng): number {
  const R = 6371000; // metres
  const φ1 = (coord1.latitude * Math.PI) / 180; // φ, λ in radians
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres

  return d;
}

/**
 * Finds the farthest event from the center of the given event cluster.
 * @param cluster - The event cluster to search in.
 * @returns An object containing the farthest event and its distance from the cluster's center.
 */
export const findFarthestEvent = (cluster: EventCluster) => {
  let maxDistance = 0;
  let farthestEvent = null;

  cluster.events.forEach(event => {
    const distance = getCoordinateDistance(
      event.location,
      cluster.centerCoordinate,
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      farthestEvent = event;
    }
  });

  return {farthestEvent, maxDistance};
};
