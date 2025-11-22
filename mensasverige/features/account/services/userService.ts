import apiClient from '../../common/services/apiClient';
import { UserUpdate } from '../../../api_schema/types';
import { AuthResponse, User } from '../../../api_schema/types';
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
  try {
    const formData = new FormData();
    
    // Extract file extension to determine proper MIME type
    const fileExtension = uri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg'; // default
    let fileName = 'avatar.jpg'; // default
    
    if (fileExtension === 'png') {
      mimeType = 'image/png';
      fileName = 'avatar.png';
    } else if (fileExtension === 'jpeg' || fileExtension === 'jpg') {
      mimeType = 'image/jpeg';
      fileName = 'avatar.jpg';
    } 
    
    formData.append('file', {
      uri: uri,
      name: fileName,
      type: mimeType,
    } as any);
    
    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      timeout: 3000,
    });
    
    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error('Servern returnerade ett oväntat svar.');
    }
  } catch (error: any) {
    console.error('Failed to upload avatar:', error);
    
    if (error?.response?.status === 413) {
      throw new Error('Bilden är för stor. Välj en mindre bild.');
    } else if (error?.response?.status === 400) {
      throw new Error('Ogiltigt bildformat. Använd JPG, PNG eller WebP.');
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      throw new Error('Uppladdningen tog för lång tid. Kontrollera din internetanslutning.');
    } else if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Kunde inte ladda upp bilden. Försök igen.');
    }
  }
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
  
  try {
    // Make individual requests for each user ID using the new endpoint
    const userPromises = userIds.map(userId => 
      apiClient.get(`/users/${userId}`)
        .then(response => {
          if (response.status === 200) {
            return response.data;
          }
          return null;
        })
        .catch(error => {
          console.log(`Failed to get user ${userId}:`, error instanceof Error ? error.message : error);
          return null;
        })
    );
    
    const users = await Promise.all(userPromises);
    // Filter out null responses (failed requests)
    return users.filter((user): user is User => user !== null);
  } catch (error) {
    console.error('Failed to get users:', error instanceof Error ? error.message : error);
    return [];
  }
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
