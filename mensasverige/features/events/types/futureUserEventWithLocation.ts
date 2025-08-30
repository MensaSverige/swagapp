import {LatLng} from 'react-native-maps';
import FutureUserEvent, {isFutureUserEvent} from './futureUserEvent';

type LocationWithDescription = LatLng & {
  description?: string;
};

type FutureUserEventWithLocation = FutureUserEvent & {
  location: LocationWithDescription;
};

export function isFutureUserEventWithLocation(
  event: FutureUserEvent,
): event is FutureUserEventWithLocation {
  return (
    (isFutureUserEvent(event) &&
      event.location &&
      event.location.latitude !== undefined &&
      event.location.latitude !== 0 &&
      event.location.longitude !== undefined &&
      event.location.longitude !== 0) ??
    false
  );
}

export default FutureUserEventWithLocation;
