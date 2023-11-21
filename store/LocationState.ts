import {LatLng} from 'react-native-maps';
import UserWithLocation from '../types/userWithLocation';

export interface LocationState {
  usersWithLocation: UserWithLocation[];
  currentLocation: LatLng;
  setUsersWithLocation: (users: UserWithLocation[]) => void;
  setUserLocation: (longitude: number, latitude: number) => void;
}
export const createLocationSlice = (set: any): LocationState => ({
  usersWithLocation: [],
  currentLocation: {
    longitude: 0,
    latitude: 0,
  },
  setUsersWithLocation: (usersWithLocation: UserWithLocation[]) =>
    set({usersWithLocation}),
  setUserLocation: (longitude, latitude) => set({longitude, latitude}),
});
