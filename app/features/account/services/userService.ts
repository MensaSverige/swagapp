import apiClient from '../../common/services/apiClient';
import { ShowLocation, UserUpdate } from '../../../api_schema/types';
import { AuthResponse, User } from '../../../api_schema/types';
import * as Keychain from 'react-native-keychain';


export const updateUser = async (
  userUpdate: UserUpdate
): Promise<User> => {
  console.log('updating user', userUpdate)
  return apiClient
    .put('/users/me', userUpdate)
    .then(
      response => {
        console.log('user updated', response.data)
        return response.data; 
      },
      error => {
        throw new Error(error.message || error);
      },
    )
};
export const getUser = async (userName: string): Promise<User> => {
  return apiClient
    .get('/user_by_username/' + userName)
    .then(
      response => {
        if (response.status === 200) {
          return response.data;
        } else {
          return null;
        }
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Failed to get user:', error.message || error);
    });
};


