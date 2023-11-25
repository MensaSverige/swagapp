import {create} from 'zustand';
import {Region} from 'react-native-maps';

interface Location {
  longitude: number;
  latitude: number;
}
export interface LocationState {
  currentLocation: Location;
  showlocation: boolean;
  region: Region;
  locationUpdateInterval: number;
  setRegion: (region: Region) => void;
  setUserLocation: (longitude: number, latitude: number) => void;
}
export const createLocationSlice = (set: any): LocationState => ({
  currentLocation: {
    longitude: 0,
    latitude: 0,
  },
  showlocation: false,
  locationUpdateInterval: 60000,
  region: {
    latitude: 59.269230831933754,
    latitudeDelta: 0.00209927763049933,
    longitude: 15.20618537440896,
    longitudeDelta: 0.002381466329099524,
  },
  setRegion: region => set({region}),
  setUserLocation: (longitude, latitude) => set({longitude, latitude}),
});
