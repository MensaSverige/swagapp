import {Region} from 'react-native-maps';
import UserWithLocation from '../types/userWithLocation';
import {StateCreator} from 'zustand';

interface Location {
  longitude: number;
  latitude: number;
}
export interface FilterProps {
   name?: string, 
   showHoursAgo?: number
}

export const defaultFilter: FilterProps = { 
  name: undefined, 
  showHoursAgo: 8 
};

export const filterUsers = (users: UserWithLocation[], userFilter: FilterProps) => {
  if (!users) return [];
  
  const filterTime = new Date();
  filterTime.setHours(filterTime.getHours() - (userFilter.showHoursAgo ?? 0));
  return users.filter(user =>
    (!userFilter.name || `${user.firstName} ${user.lastName}`.toLowerCase().includes(userFilter.name.toLowerCase())) &&
    (!userFilter.showHoursAgo || (user.location?.timestamp && new Date(user.location.timestamp).getTime() >= filterTime.getTime())) 
  );
};
export interface LocationSlice {
  userFilter: FilterProps
  filteredUsers: UserWithLocation[];
  setUserFilter: (filter: FilterProps) => void;
  setFilteredUsers: (name?: string, locationTimestamp?: Date) => void;

  currentLocation: Location;
  hasLocationPermission: boolean;
  locationUpdateInterval: number;
  region: Region;
  showlocation: boolean;
  usersShowingLocation: UserWithLocation[];
  selectedUser: UserWithLocation | null;
  setUsersShowingLocation: (users: UserWithLocation[]) => void;
  setHasLocationPermission: (hasLocationPermission: boolean) => void;
  setRegion: (region: Region) => void;
  setUserLocation: (longitude: number, latitude: number) => void;
  setSelectedUser: (user: UserWithLocation | null) => void;
}

export const createLocationSlice: StateCreator<LocationSlice> = (set, get) => ({
  userFilter: defaultFilter,
  filteredUsers: [],
  setUserFilter: (filter) => {
    set({ userFilter: filter }),
    get().setFilteredUsers();
  },
  setFilteredUsers: () => {
    const { userFilter, usersShowingLocation } = get();
    console.log('Filtering users:', userFilter);
    const filteredUsers = filterUsers(usersShowingLocation, userFilter);
    console.log('Filtered users:', filteredUsers.length);
    set({ filteredUsers });
  },
  currentLocation: {
    longitude: 0,
    latitude: 0,
  },
  hasLocationPermission: false,
  locationUpdateInterval: 60000,
  region: {
    latitude: 59.269230831933754,
    latitudeDelta: 0.00209927763049933,
    longitude: 15.20618537440896,
    longitudeDelta: 0.002381466329099524,
  },
  showlocation: false,
  usersShowingLocation: [],
  selectedUser: null,
  setUsersShowingLocation: usersShowingLocation => { 
    set({usersShowingLocation}),
    get().setFilteredUsers();
  },
  setHasLocationPermission: hasLocationPermission =>
    set({hasLocationPermission}),
  setRegion: region => set({region}),
  setUserLocation: (longitude, latitude) =>
    set(state => ({
      currentLocation: {
        ...state.currentLocation,
        longitude,
        latitude,
      },
    })),
  setSelectedUser: user => set({selectedUser: user}),
});
