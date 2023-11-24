import {User} from '../types/user';
import apiClient from '../apiClient';
import UserWithLocation, { isUserWithLocation } from '../types/userWithLocation';

export interface LocationUpdateData {
  username: string;
  location: {
    latitude: number;
    longitude: number;
  }
}

export const getUserLocations = async () => {
  const response = await apiClient.get('/users_showing_location');
  console.log('response', response);
  if(response.data){
    return response.data.filter(isUserWithLocation);
  }
  return [] as UserWithLocation[];
};

export const updateUserLocation = async (data: LocationUpdateData) => {
  try {
    const respose = await apiClient.post(
      '/update_user_location',
      JSON.stringify(data),
    );

    console.log('Location updated successfully:', respose);
  } catch (error: any) {
    console.error('Error updating location:', error.message || error);
  }
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
