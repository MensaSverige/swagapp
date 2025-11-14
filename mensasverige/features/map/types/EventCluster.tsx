import EventWithLocation from '../../events/types/eventWithLocation';
import {LatLng} from 'react-native-maps';

export interface EventCluster {
  events: EventWithLocation[];
  centerCoordinate: LatLng;
}
