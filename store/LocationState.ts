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
    latitude: 59.27017026403876,
    latitudeDelta: 0.009089880072409073,
    longitude: 15.209892522543669,
    longitudeDelta: 0.010312087833883155,
  },
  setRegion: region => set({region}),
  setUserLocation: (longitude, latitude) => set({longitude, latitude}),
});
