import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL, API_VERSION } from '@env';
import useStore from '../store/store';
import { getOrRefreshAccessToken } from './authService';

const apiClient = axios.create({
  baseURL: `${API_URL}/${API_VERSION}`,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getOrRefreshAccessToken();
      config.headers['Authorization'] = `Bearer ${token}`;
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
