import {LatLng} from 'react-native-maps';
import FutureUserEvent, {isFutureUserEvent} from './futureUserEvent';

type LocationWithDescription = LatLng & {
  description?: string;
};

type UserEventWithLocation = FutureUserEvent & {
  location: LocationWithDescription;
};

export function isUserEventWithLocation(
  event: FutureUserEvent,
): event is UserEventWithLocation {
  return (
    isFutureUserEvent(event) &&
    event.location !== undefined &&
    event.location.latitude !== undefined &&
    event.location.latitude !== 0 &&
    event.location.longitude !== undefined &&
    event.location.longitude !== 0
  );
}

export default UserEventWithLocation;
