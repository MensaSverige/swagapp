/**
 * apiClient.ts
 *
 * This service is responsible for making API requests. It exports an `apiClient` instance of axios that is configured with a base URL
 * composed of the API_URL and API_VERSION environment variables.
 *
 * The `apiClient` instance has two interceptors:
 *
 * 1. A request interceptor that tries to get or refresh the access token using the `getOrRefreshAccessToken` function from authService.ts.
 * If the function is successful, the interceptor adds an Authorization header with a bearer token to the request. If the function fails,
 * the request is made without the Authorization header.
 *
 * 2. A response interceptor that updates the `backendConnection` state in the store based on the success or failure of the API request.
 * If a request fails due to a network error, the `backendConnection` state is set to false. If a request is successful, the `backendConnection`
 * state is set to true.
 *
 * This service is different from the authService.ts service, which is specifically for authentication-related tasks. The apiClient.ts service
 * is for general API requests.
 */
import axios, {AxiosResponse} from 'axios';
import {API_URL, API_VERSION} from '@env';
import useStore from '../store/store';
import {getOrRefreshAccessToken} from './authService';

const apiClient = axios.create({
  baseURL: `${API_URL}/${API_VERSION}`,
});

apiClient.interceptors.request.use(
  async config => {
    try {
      const token = await getOrRefreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.log('Error getting access token', error);
    }
    return config;
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
    }
    return Promise.reject(error);
  },
);

export default apiClient;
