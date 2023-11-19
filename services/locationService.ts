import {User} from '../types/user';
import apiClient from '../apiClient';

interface LocationUpdateData {
  username: string;
  lat: number;
  lng: number;
}

const getUserLocations = async () => {
    // const response = await fetch(config.apiUrl + '/users_showing_location');
    // const data: UserLocation[]  = await response.json();
    // console.log('data', data);
    // setUsersLocation(data);
  };


const updateUserLocation = async (data: LocationUpdateData) => {
  try {
    // const response = await fetch(config.apiUrl + '/update_user_location', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(data),
    // });
    // if (!response.ok) {
    //   const errorData: string = await response.json();
    //   throw new Error(errorData || 'An error occurred while updating the location.');
    // }
    // const responseData = await response.json();
    // console.log('Location updated successfully:', responseData);
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
        // Generate random coordinates for the sake of example. These values should be within reasonable distance from your actual map area.
        latitude: 59.2 + Math.random() * 0.1 - 0.005,
        longitude: 15.2 + Math.random() * 0.1 - 0.005,
      },
    };
    fakeUsers.push(fakeUser);
  }

  return fakeUsers;
}
