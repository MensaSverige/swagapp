import {LatLng} from 'react-native-maps';
import FutureEvent, {isFutureEvent} from './futureEvent';

type LocationWithDescription = LatLng & {
  description?: string;
};

type EventWithLocation = FutureEvent & {
  location: LocationWithDescription;
};

export function isEventWithLocation(
  event: FutureEvent,
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
