import apiClient from '../../common/services/apiClient';
import UserWithLocation, {calculateOnlineStatus, isUserWithLocation} from '../types/userWithLocation';
import { UserLocation } from '../../../api_schema/types';

export const getUserLocations = async (): Promise<UserWithLocation[]> => {
  return apiClient
  .get('/users', { params: { show_location: true } })
    .then(
      response => {
        if (response.data) {
          const usersWithLocation = response.data.filter(isUserWithLocation);
          return usersWithLocation.map((user: UserWithLocation) => ({
            ...user,
            onlineStatus: calculateOnlineStatus(user.location.timestamp),
          }));
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching user locations:', error);
    });
};

export const updateUserLocation = async (data: UserLocation) => {
  console.log('Updating location:', data);
  return apiClient
    .put('/users/me/location', data)
    .then(
      () => {
        console.log('Location updated successfully');
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error updating location:', error.message || error);
    });
};

