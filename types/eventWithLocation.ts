import {LatLng} from 'react-native-maps';
import {Event} from './event';

type LocationWithDescription = LatLng & {
  description?: string;
};

type EventWithLocation = Event & {
  location: LocationWithDescription;
};

export function isEventWithLocation(event: Event): event is EventWithLocation {
  return (
    event.location !== undefined &&
    event.location.latitude !== undefined &&
    event.location.latitude !== 0 &&
    event.location.longitude !== undefined &&
    event.location.longitude !== 0
  );
}

export default EventWithLocation;
