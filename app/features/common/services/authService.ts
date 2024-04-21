/**
 * authService.ts
 * 
 * This service is responsible for handling authentication-related tasks such as logging in and refreshing access tokens.
 * It exports an `authenticate` function which takes a username, password, and a testMode flag, and returns a Promise that 
 * resolves to an AuthResponse or undefined.
 * 
 * The `authenticate` function uses the `authClient` instance. This instance is created with a base URL that is composed of 
 * the API_URL and API_VERSION environment variables.
 * 
 * This service differs from the apiClient.ts service in the following ways:
 * 
 * 1. The apiClient.ts service is a general-purpose service for making API requests. 
 * It uses an instance of axios with a request interceptor that automatically adds an Authorization header with a bearer token 
 * to every request. This token is retrieved using the `getOrRefreshAccessToken` function from authService.ts. If the token 
 * cannot be retrieved, the request is made without the Authorization header.
 * 
 * 2. The apiClient.ts service also has a response interceptor that updates the `backendConnection` state in the store based on 
 * the success or failure of the API request. If a request fails due to a network error, the `backendConnection` state is set 
 * to false. If a request is successful, the `backendConnection` state is set to true.
 * 
 * 3. The apiClient.ts service handles 401 Unauthorized errors by setting a `_retry` flag on the original request and retrying 
 * the request. This is not done in the authService.ts service.
 * 
 * 4. The authService.ts service is specifically for authentication-related tasks, while the apiClient.ts service is for 
 * general API requests.
 */

import { AuthRequest, AuthResponse, HTTPValidationError, ValidationError } from '../../../api_schema/types';
import axios, { AxiosResponse } from 'axios';
import { API_URL, API_VERSION } from '@env';
import { UserCredentials } from 'react-native-keychain';
import * as Keychain from 'react-native-keychain';

const authClient = axios.create({
    baseURL: `${API_URL}/${API_VERSION}`,
});

export const authenticate = async (username: string, password: string, testMode: boolean): Promise<AuthResponse | undefined> => {
    return authClient
        .post('/authm',
            {
                username: username,
                password: password,
            } as AuthRequest
        )
        .then(async response => {
            if (response.status === 200) {
                const authresponse: AuthResponse = response.data;
                console.log('Auth response', authresponse);
                return storeAndValidateAuthResponse(authresponse);
            } else {
                if (response.status === 401) {
                    console.error('Invalid credentials');
                    throw new Error('Fel användarnamn eller lösenord.');
                } else if (response.status === 422) {
                    const data: HTTPValidationError = response.data;
                    const detail = data.detail as ValidationError[];
                    if (detail.some(item => item.msg === 'Test mode is not enabled')) {
                        throw new Error('Testläge är inte aktiverat i backend. Appen borde inte köras i testläge.');
                    } else {
                        console.error('backend responded with status 400', data);
                        throw new Error('Något gick fel. Försök igen senare.');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Login error', error.message || error);
            if (error.message.includes('Network Error')) {
                throw new Error(`Det går inte att nå servern just nu. Försök igen om en stund.`);
            } else {
                throw new Error('Något gick fel. Försök igen senare.');
            }
        });
}

export const getOrRefreshAccessToken = async (): Promise<string> => {
    const accessToken = await Keychain.getGenericPassword({ service: 'accessToken' })
    const accessTokenExpiry = await Keychain.getGenericPassword({ service: 'accessTokenExpiry' })
    const refreshToken = await Keychain.getGenericPassword({ service: 'refreshToken' });

    if (accessToken && accessTokenExpiry && refreshToken) {
        const tokenExpiryDate = new Date(accessTokenExpiry.password);
        if (new Date() > new Date(tokenExpiryDate.getTime() - 60 * 1000)) { // refresh 60 seconds before expiry
            try {
                const newAccessToken = await refreshAccessToken(refreshToken.password);
                console.log('Refreshed access token');
                return newAccessToken;
            } catch (error) {
                console.log('Error refreshing access token', error);
                const authResponse = await attemptLoginWithStoredCredentials();
                if (authResponse) {
                    return authResponse.accessToken;
                }
            }
        } else {
            return accessToken.password;
        }
    }
    return Promise.reject('No access token');
}

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    return authClient
        .post('/refresh_token', { refresh_token: refreshToken })
        .then((response: AxiosResponse) => {
            if (response.status === 200) {
                const data: AuthResponse = response.data;
                console.log('Auth response', data);
                storeAndValidateAuthResponse(data);
                return data.accessToken;
            }
            else {
                return Promise.reject('Failed to refresh access token');
            }
        })
}

export const attemptLoginWithStoredCredentials = async (): Promise<AuthResponse | undefined> => {
    return Keychain.getGenericPassword({ service: 'credentials' })
        .then((credentials: UserCredentials | false) => {
            if (credentials) {
                return authenticate(credentials.username, credentials.password, false);
            }
            throw new Error('No stored credentials');
        })
        .catch((error: Error) => {
            console.error('Login with stored credentials failed', error);
            return Keychain.resetGenericPassword({ service: 'credentials' })
            .then(() => Promise.reject('Login failed'));
        });
}

export const resetUserCredentials = async (): Promise<boolean> => {
    return Promise.all([
        Keychain.resetGenericPassword({ service: 'accessToken' }),
        Keychain.resetGenericPassword({ service: 'accessTokenExpiry' }),
        Keychain.resetGenericPassword({ service: 'credentials' }),
        Keychain.resetGenericPassword({ service: 'refreshToken' }),
    ])
    .then(() => true)
}

export const storeAndValidateAuthResponse = async (authresponse: AuthResponse): Promise<AuthResponse | undefined> => {
    if (authresponse.accessToken && authresponse.refreshToken && authresponse.accessTokenExpiry && authresponse.user) {
        await Keychain.setGenericPassword('accessToken', authresponse.accessToken, {
            service: 'accessToken',
        });
        await Keychain.setGenericPassword('accessTokenExpiry', authresponse.accessTokenExpiry.toString(), {
            service: 'accessTokenExpiry',
        });
        await Keychain.setGenericPassword('refreshToken', authresponse.refreshToken, {
            service: 'refreshToken',
        });

        if (authresponse.user !== null && authresponse.user !== undefined) {
            return authresponse;
        } else {
            throw new Error('User data is undefined');
        }
    } else {
        console.error('Received null accessToken or refreshToken');
        throw new Error('Något gick fel. Försök igen senare.');
    }
}
