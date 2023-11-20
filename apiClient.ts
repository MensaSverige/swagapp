import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import * as Keychain from 'react-native-keychain';
import appConfig from './appConfig';
import useStore from './store/store';

const apiClient = axios.create({
  baseURL: appConfig.baseURL,
});

apiClient.interceptors.request.use(
  async config => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'accessToken',
      });
      if (credentials) {
        config.headers.Authorization = `Bearer ${credentials.password}`;
      }
      config.headers['Content-Type'] = 'application/json';
    } catch (error) {
      console.log('Error retrieving access token', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

async function refreshAccessToken(originalRequest: AxiosRequestConfig) {
  try {
    const refreshTokenItem = await Keychain.getGenericPassword({
      service: 'refreshToken',
    });
    if (refreshTokenItem) {
      const response = await apiClient.post('/refresh_token', {
        refresh_token: refreshTokenItem.password,
      });
      if (response.status === 200) {
        await Keychain.setGenericPassword(
          'accessToken',
          response.data.access_token,
          {service: 'accessToken'},
        );
        return apiClient(originalRequest);
      }
    }
  } catch (error) {
    console.log(
      'Error while refreshing token, trying to log in using stored credentials',
      error,
    );
  }
  console.log(
    'Refreshing token failed, trying to log in using stored credentials',
  );
  return attemptLoginWithStoredCredentials(originalRequest);
}

async function attemptLoginWithStoredCredentials(
  originalRequest: AxiosRequestConfig,
) {
  try {
    console.log('Attempting to log in using stored credentials');
    const credentials = await Keychain.getGenericPassword({
      service: 'credentials',
    });
    if (credentials) {
      const loginResponse = await apiClient.post('/auth', {
        username: credentials.username,
        password: credentials.password,
      });
      if (loginResponse.status === 200) {
        console.log('0 Login with stored credentials successful');
        await Keychain.setGenericPassword(
          'accessToken',
          loginResponse.data.access_token,
          {service: 'accessToken'},
        );
        await Keychain.setGenericPassword(
          'refreshToken',
          loginResponse.data.refresh_token,
          {service: 'refreshToken'},
        );
        return apiClient(originalRequest);
      } else {
        console.log('Login with stored credentials failed, giving up.');
      }
    } else {
      console.log('No stored credentials found, giving up.');
    }
  } catch (loginError) {
    console.error('Login with stored credentials failed', loginError);
  }
  const store = useStore.getState();
  store.setUser(null);
  // Remove stored credentials and tokens. Clean slate!
  await Keychain.resetGenericPassword({service: 'accessToken'});
  await Keychain.resetGenericPassword({service: 'refreshToken'});
  await Keychain.resetGenericPassword({service: 'credentials'});
  return Promise.reject('Login failed');
}

// Response Interceptor to refresh the access token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config;
    if (
      error.response.status === 401 &&
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
