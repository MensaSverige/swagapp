import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import * as Keychain from 'react-native-keychain';
import {API_URL, API_VERSION} from '@env';
import useStore from '../store/store';
import {UserCredentials} from 'react-native-keychain';

const apiClient = axios.create({
  baseURL: `${API_URL}/${API_VERSION}`,
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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const store = useStore.getState();
    store.setBackendConnection(true);
    return response;
  },
  (error: any) => {
    const isNetworkError = error.message.includes('Network Error');
    if (isNetworkError) {
      const store = useStore.getState();
      store.setBackendConnection(false);
    }

    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/authm')
    ) {
      originalRequest._retry = true;
      //return refreshAccessToken(originalRequest);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
