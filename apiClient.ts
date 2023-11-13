import axios from 'axios';
import * as Keychain from 'react-native-keychain';

const customAxios = axios.create({
  baseURL: 'https://swag.mikael.green/api',
});

// Request Interceptor to add the access token
customAxios.interceptors.request.use(
  async config => {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        config.headers.Authorization = `Bearer ${credentials.password}`;
      }
    } catch (error) {
      console.log('Error retrieving access token', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response Interceptor to refresh the access token
customAxios.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          const response = await customAxios.post('/refresh_token', {
            refresh_token: credentials.username,
          });
          if (response.status === 200) {
            await Keychain.setGenericPassword(
              'accessToken',
              response.data.access_token,
            );
            return customAxios(originalRequest);
          }
        }
      } catch (credentialsError) {
        console.log(
          'Error processing keychain when refreshing access token',
          credentialsError,
        );
      }
    }
    return Promise.reject(error);
  },
);

export default customAxios;
