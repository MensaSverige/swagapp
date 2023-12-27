import {User} from '../types/user';
import apiClient from '../apiClient';
import UserWithLocation, {isUserWithLocation} from '../types/userWithLocation';

export interface LocationUpdateData {
  username: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const getUserLocations = async (): Promise<UserWithLocation[]> => {
  return apiClient
    .get('/users_showing_location')
    .then(
      response => {
        console.log('response', response);
        if (response.data) {
          return response.data.filter(isUserWithLocation);
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

export const updateUserLocation = async (data: LocationUpdateData) => {
  return apiClient
    .post('/update_user_location', JSON.stringify(data))
    .then(
      response => {
        console.log('Location updated successfully:', response);
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error updating location:', error.message || error);
    });
};

function generateFakeUserLocations(numberOfUsers: number) {
  const fakeUsers: User[] = [];

  for (let i = 0; i < numberOfUsers; i++) {
    const fakeUser: User = {
      name: `User${i + 1}`,
      username: `user${i + 1}`,
      avatar_url: `https://secure.gravatar.com/avatar/e6bb5f4f4707bfdd1b205e2b2a2dd130?d=https%3A%2F%2Fmedlem.mensa.se%2Fuploads%2Fset_resources_2%2F84c1e40ea0e759e3f1505eb1788ddf3c_default_photo.png`,
      location: {
        latitude: 59.269249 + Math.random() * 0.01 - 0.005,
        longitude: 15.206333 + Math.random() * 0.01 - 0.005,
      },
    };
    fakeUsers.push(fakeUser);
  }

  return fakeUsers;
}
