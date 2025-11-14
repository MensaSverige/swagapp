import { LatLng } from 'react-native-maps';

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

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres

  return d;
}
