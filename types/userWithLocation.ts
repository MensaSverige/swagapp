import {LatLng} from 'react-native-maps';
import {User} from './user';

type LocationWithDescription = LatLng & {
  description?: string;
};

type UserWithLocation = User & {
  location: LocationWithDescription;
};

export function isUserWithLocation(user: User): user is UserWithLocation {
  return (
    user.location !== undefined &&
    user.location.latitude !== undefined &&
    user.location.latitude !== 0 &&
    user.location.longitude !== undefined &&
    user.location.longitude !== 0
  );
}

export default UserWithLocation;
