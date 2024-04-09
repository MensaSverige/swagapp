import apiClient from '../../common/services/apiClient';
import { User } from '../../../api_schema/types';
import * as Keychain from 'react-native-keychain';


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
