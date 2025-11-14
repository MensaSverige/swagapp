import { LatLng } from 'react-native-maps';
import EventWithLocation from '../../events/types/eventWithLocation';


export function getCenterCoordinate(events: EventWithLocation[]): LatLng {
  const latSum = events.reduce((sum, event) => {
    return sum + event.location.latitude;
  }, 0);
  const lngSum = events.reduce((sum, event) => {
    return sum + event.location.longitude;
  }, 0);
  const latAvg = latSum / events.length;
  const lngAvg = lngSum / events.length;
  return {
    latitude: latAvg,
    longitude: lngAvg,
  };
}
