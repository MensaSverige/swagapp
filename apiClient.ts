import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import appConfig from './appConfig';
import useStore from './store';

const apiClient = axios.create({
  baseURL: appConfig.baseURL,
});

// Request Interceptor to add the access token
apiClient.interceptors.request.use(
  async config => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'accessToken',
      });
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
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh_token')
    ) {
      console.log('Request failed to url: ', originalRequest.url);
      originalRequest._retry = true;
      try {
        const credentials = await Keychain.getGenericPassword({
          service: 'refreshToken',
        });
        if (credentials) {
          console.log('Refreshing access token');
          const response = await apiClient.post('/refresh_token', {
            refresh_token: credentials.password,
          });
          if (response.status === 200) {
            await Keychain.setGenericPassword(
              'accessToken',
              response.data.access_token,
            );
            return apiClient(originalRequest);
          }
        }
      } catch (credentialsError) {
        const store = useStore.getState();
        store.setUser(null);
        console.log(
          'Error processing keychain when refreshing access token',
          credentialsError,
        );
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
