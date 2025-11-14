import apiClient from '../../common/services/apiClient';
import { UserUpdate } from '../../../api_schema/types';
import { AuthResponse, User } from '../../../api_schema/types';
import * as Keychain from 'react-native-keychain';
import { attemptLoginWithStoredCredentials, storeAndValidateAuthResponse } from '../../common/services/authService';


export const updateUser = async (
  userUpdate: UserUpdate
): Promise<User> => {
  console.log('updating user', userUpdate)
  return apiClient
    .put('/users/me', userUpdate)
    .then(
      response => {
        return response.data;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
};

export const uploadAvatar = async (uri: string): Promise<User> => {
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  });
  return apiClient
    .post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(response => {
      if (response.status === 200) {
        return response.data;
      }
      else {
        return Promise.reject('Failed to upload avatar');
      }
    })
    .catch(error => {
      console.error('Failed to upload avatar:', error.message || error);
      return Promise.reject('Failed to upload avatar');
    });
}

export const tryGetCurrentUser = async (): Promise<AuthResponse | undefined> => {
  return apiClient
    .get('/users/me', { timeout: 500 })
    .then(response => { 
      if (response.status === 200) {
        return storeAndValidateAuthResponse(response.data);
      } else {
        return response.data().then((data: any) => {
          throw new Error(`Could not get user object. Data: ${data}`);
        });
      }
    })
    .catch(error => {
      if (!error.message.includes('Network Error')) {
        // Error was not Network Error, which means login failed due to invalid token.
        // Attempt to login with stored credentials.
        return attemptLoginWithStoredCredentials();
      }
    });

}

//TODO: fix backend
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  if (!userIds || userIds.length === 0) {
    return Promise.reject('No user ids provided');
  }
  return apiClient
    .get('/users_by_ids', {
      params: { userIds },
    })
    .then(
      response => {
        if (response.status === 200) {
          return response.data;
        } else {
          return [];
        }
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Failed to get users:', error.message || error);
    });
}

export const getUser = async (userName: string): Promise<User> => {
  if (!userName) {
    return Promise.reject('No username provided');
  }
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
