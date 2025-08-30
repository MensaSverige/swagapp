import { EventCluster } from '../types/EventCluster';
import { getCoordinateDistance } from './getCoordinateDistance';

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
      cluster.centerCoordinate
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      farthestEvent = event;
    }
  });

  return { farthestEvent, maxDistance };
};
