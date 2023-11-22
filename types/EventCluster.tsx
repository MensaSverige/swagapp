import EventWithLocation from './eventWithLocation';
import {LatLng} from 'react-native-maps';

export interface EventCluster {
  events: EventWithLocation[];
  centerCoordinate: LatLng;
}
