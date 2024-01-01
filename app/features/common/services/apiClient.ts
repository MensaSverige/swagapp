import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import * as Keychain from 'react-native-keychain';
import {API_URL} from '@env';
import useStore from '../store/store';
import {UserCredentials} from 'react-native-keychain';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  config => {
    return Keychain.getGenericPassword({service: 'accessToken'})
      .then((credentials: UserCredentials | false) => {
        if (credentials) {
          config.headers.Authorization = `Bearer ${credentials.password}`;
        }
        config.headers['Content-Type'] = 'application/json';
        return config;
      })
      .catch((error: Error) => {
        console.log('Error retrieving access token', error);
        return config;
      });
  },
  (error: Error) => Promise.reject(error),
);

function refreshAccessToken(originalRequest: AxiosRequestConfig) {
  return Keychain.getGenericPassword({service: 'refreshToken'})
    .then((refreshTokenItem: UserCredentials | false) => {
      if (refreshTokenItem) {
        return apiClient
          .post('/refresh_token', {refresh_token: refreshTokenItem.password})
          .then((response: AxiosResponse) => {
            if (response.status === 200) {
              return Keychain.setGenericPassword(
                'accessToken',
                response.data.access_token,
                {service: 'accessToken'},
              ).then(() => apiClient(originalRequest));
            }
            throw new Error('Refresh token failed');
          });
      }
      throw new Error('No refresh token');
    })
    .catch((error: Error) => {
      console.log('Error while refreshing token', error);
      return attemptLoginWithStoredCredentials(originalRequest);
    });
}

function attemptLoginWithStoredCredentials(
  originalRequest: AxiosRequestConfig,
) {
  return Keychain.getGenericPassword({service: 'credentials'})
    .then((credentials: UserCredentials | false) => {
      if (credentials) {
        return apiClient
          .post('/auth', {
            username: credentials.username,
            password: credentials.password,
          })
          .then((loginResponse: AxiosResponse) => {
            if (loginResponse.status === 200) {
              console.log('Login with stored credentials successful');
              return Promise.all([
                Keychain.setGenericPassword(
                  'accessToken',
                  loginResponse.data.access_token,
                  {service: 'accessToken'},
                ),
                Keychain.setGenericPassword(
                  'refreshToken',
                  loginResponse.data.refresh_token,
                  {service: 'refreshToken'},
                ),
              ]).then(() => apiClient(originalRequest));
            }
            throw new Error('Login failed');
          });
      }
      throw new Error('No stored credentials');
    })
    .catch((error: Error) => {
      console.error('Login with stored credentials failed', error);
      const store = useStore.getState();
      store.setUser(null);
      return Promise.all([
        Keychain.resetGenericPassword({service: 'accessToken'}),
        Keychain.resetGenericPassword({service: 'refreshToken'}),
        Keychain.resetGenericPassword({service: 'credentials'}),
      ]).then(() => Promise.reject('Login failed'));
    });
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh_token') &&
      !originalRequest.url.includes('/auth')
    ) {
      originalRequest._retry = true;
      return refreshAccessToken(originalRequest);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
