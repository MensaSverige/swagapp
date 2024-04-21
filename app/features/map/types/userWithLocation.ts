import {LatLng} from 'react-native-maps';
import { User } from '../../../api_schema/types';

type LocationWithDescription = LatLng & {
  description?: string;
};

export type OnlineStatus = 'online' | 'away' | 'offline';

type UserWithLocation = User & {
  location: LocationWithDescription;
  onlineStatus: OnlineStatus;
};
export function isUserWithLocation(user: User): user is UserWithLocation {
  return (
    user.location !== undefined &&
    user.location !== null &&
    user.location.latitude !== undefined &&
    user.location.latitude !== 0 &&
    user.location.longitude !== undefined &&
    user.location.longitude !== 0
  );
}

export function calculateOnlineStatus(timestamp: string | null): OnlineStatus {
  if (!timestamp) {
    return 'offline';
  }
  const now = Date.now();
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
  const sixtyMinutesAgo = new Date(now - 60 * 60 * 1000);

  if (timestamp && new Date(timestamp) > tenMinutesAgo) {
    return 'online';
  } else if (timestamp && new Date(timestamp) > sixtyMinutesAgo) {
    return 'away';
  } else {
    return 'offline';
  }
}


export default UserWithLocation;
