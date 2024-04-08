import apiClient from '../../common/services/apiClient';
import { User } from '../../../api_schema/types';
import * as Keychain from 'react-native-keychain';

export const tryGetCurrentUser = async () => {
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
        .get('/users/me', {timeout: 500})
        .then(response => {
          if (response.status === 200) {
            const userData: User = response.data;
            return userData;
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
export const updateUser = async (
  user: User,
  showLocation: boolean,
  showContactInfo: boolean,
  contactInfo: string,
) => {
  return apiClient
    .put('/user/' + user.userId, {
      ...user,
      show_location: showLocation,
      show_contact_info: showContactInfo,
      contact_info: contactInfo,
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
