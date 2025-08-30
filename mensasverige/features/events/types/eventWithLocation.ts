import {LatLng} from 'react-native-maps';
import FutureEvent, {isFutureEvent} from './futureEvent';
import FutureUserEvent from './futureUserEvent';

type LocationWithDescription = LatLng & {
  description?: string;
};

type EventWithLocation = (FutureEvent | FutureUserEvent) & {
  location: LocationWithDescription;
};

export function isEventWithLocation(
  event: FutureEvent | FutureUserEvent,
): event is EventWithLocation {
  return (
    isFutureEvent(event) &&
    event.location !== undefined &&
    event.location.latitude !== undefined &&
    event.location.latitude !== 0 &&
    event.location.longitude !== undefined &&
    event.location.longitude !== 0
  );
}

export default EventWithLocation;
