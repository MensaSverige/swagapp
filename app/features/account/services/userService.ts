import apiClient from '../../common/services/apiClient';
import { UserUpdate } from '../../../api_schema/types';
import { AuthResponse, User } from '../../../api_schema/types';
import * as Keychain from 'react-native-keychain';
import { attemptLoginWithStoredCredentials } from '../../common/services/authService';


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

export const uploadAvatar = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', {
    uri: uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  });
  return apiClient
    .post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(
      response => {
        return response.data.avatar_url;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Failed to upload avatar:', error.message || error);
    });
}

export const tryGetCurrentUser = async (): Promise<AuthResponse | undefined> => {
  return apiClient
    .get('/users/me', { timeout: 500 })
    .then(response => {
      if (response.status === 200) {
        const authresponse: AuthResponse = response.data;
        return storeAndValidateAuthResponse(authresponse);
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


function storeAndValidateAuthResponse(authresponse: { accessToken: string; refreshToken: string; accessTokenExpiry: string; user: { userId: number; isMember?: boolean | undefined; settings: { show_location?: "NO_ONE" | "ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION" | "ALL_MEMBERS" | "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION" | "EVERYONE" | undefined; show_email?: boolean | undefined; show_phone?: boolean | undefined; }; location?: { latitude: number; longitude: number; timestamp: string | null; accuracy: number; } | null | undefined; contact_info?: { email?: string | null | undefined; phone?: string | null | undefined; } | null | undefined; age?: number | null | undefined; slogan?: string | null | undefined; avatar_url?: string | null | undefined; firstName?: string | null | undefined; lastName?: string | null | undefined; }; }): any {
  throw new Error('Function not implemented.');
}

