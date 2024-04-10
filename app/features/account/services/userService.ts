import apiClient from '../../common/services/apiClient';
import {ShowLocation} from '../../../api_schema/types';
import { AuthResponse, User } from '../../../api_schema/types';
import * as Keychain from 'react-native-keychain';


export const updateUser = async (
  user: User,

) => {
  return apiClient
    .put('/user/' + user.userId, {user
    })
    .then(
      response => {
          return response.data;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Failed to update profile:', error.message || error);
    });
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

export const tryGetCurrentUser = async () : Promise<AuthResponse | undefined> => {
  return Keychain.getAllGenericPasswordServices().then(allSavedCredentials => {
      if (
          allSavedCredentials.some(
              credential =>
                  credential === 'accessToken' ||
                  credential === 'refreshToken' ||
                  credential === 'credentials',
          )
      ) {
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
                      // Error was not Network Error, which means login failed due to invalid credentials.
                      Keychain.resetGenericPassword();
                  }
                  throw error;
              });
      } else {
          throw new Error('No saved credentials found');
      }
  });
}
function storeAndValidateAuthResponse(authresponse: { accessToken: string; refreshToken: string; accessTokenExpiry: string; user: { userId: number; isMember?: boolean | undefined; show_location?: boolean | undefined; show_contact_info?: boolean | undefined; age?: number | null | undefined; slogan?: string | null | undefined; avatar_url?: string | null | undefined; firstName?: string | null | undefined; lastName?: string | null | undefined; email?: string | null | undefined; phone?: string | null | undefined; }; }): any {
  throw new Error('Function not implemented.');
}

