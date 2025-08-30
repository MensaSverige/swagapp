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
import * as SecureStore from "expo-secure-store";

const authClient = axios.create({
    baseURL: `${process.env.API_URL}/${process.env.API_VERSION}`,
});

export const authenticate = async (username: string, password: string, testMode: boolean, member: boolean): Promise<AuthResponse> => {
    
    const endpoint = member ? 'authm' : 'authb';
    
    return authClient
        .post(`/${endpoint}`,
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
                else {
                    console.error('backend responded with status', response.status);
                    throw new Error('Något gick fel. Försök igen senare.');
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
        const accessToken = await SecureStore.getItemAsync('accessToken');
        const accessTokenExpiry = await SecureStore.getItemAsync('accessTokenExpiry');
        const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (accessToken && accessTokenExpiry && refreshToken) {
        const tokenExpiryDate = new Date(accessTokenExpiry);
        if (new Date() > new Date(tokenExpiryDate.getTime() - 60 * 1000)) { // refresh 60 seconds before expiry
            try {
                const newAccessToken = await refreshAccessToken(refreshToken);
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
            return accessToken;
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

export const attemptLoginWithStoredCredentials = async (): Promise<AuthResponse> => {
    // First try to login with stored credentials for member users
    const memberCredentials = await SecureStore.getItemAsync('credentials');
    if (memberCredentials) {
        try {
            const credentials = JSON.parse(memberCredentials);
            return await authenticate(credentials.username, credentials.password, false, true);
        } catch (error: any) {
            // If that login fails, reset member user credentials storage.
            console.error('Login with stored credentials failed', error);
            await SecureStore.deleteItemAsync('credentials');
            return Promise.reject('Login failed');
        }
    }
    
    // If no stored credentials are found, try to login with stored credentials for non-member users
    const nonMemberCredentials = await SecureStore.getItemAsync('non-member-credentials');
    if (nonMemberCredentials) {
        try {
            const credentials = JSON.parse(nonMemberCredentials);
            return await authenticate(credentials.username, credentials.password, false, false);
        } catch (error: any) {
            // If that login fails, reset non-member user credentials storage.
            console.error('Login with stored credentials failed', error);
            await SecureStore.deleteItemAsync('non-member-credentials');
            return Promise.reject('Login failed');
        }
    }
    
    return Promise.reject('No stored credentials');
}

export const resetUserCredentials = async (): Promise<boolean> => {
    return Promise.all([
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('accessTokenExpiry'),
        SecureStore.deleteItemAsync('credentials'),
        SecureStore.deleteItemAsync('non-member-credentials'),
        SecureStore.deleteItemAsync('refreshToken'),
    ])
    .then(() => true)
}

export const storeAndValidateAuthResponse = async (authresponse: AuthResponse): Promise<AuthResponse> => {
    if (authresponse.accessToken && authresponse.refreshToken && authresponse.accessTokenExpiry && authresponse.user) {
        await SecureStore.setItemAsync('accessToken', authresponse.accessToken);
        await SecureStore.setItemAsync('accessTokenExpiry', authresponse.accessTokenExpiry.toString());
        await SecureStore.setItemAsync('refreshToken', authresponse.refreshToken);

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
