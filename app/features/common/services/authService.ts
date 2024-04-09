import { AuthRequest, AuthResponse, HTTPValidationError, User, ValidationError } from '../../../api_schema/types';
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

export const tryGetCurrentUser = async () : Promise<AuthResponse | undefined> => {
    return Keychain.getAllGenericPasswordServices().then(allSavedCredentials => {
        if (
            allSavedCredentials.some(
                credential =>
                    credential === 'accessToken' ||
                    credential === 'refreshToken' ||
                    credential === 'credentials',
            )
        ) {
            return authClient
                .get('/users/me', { timeout: 500 })
                .then(response => {
                    if (response.status === 200) {
                        const authresponse: AuthResponse = response.data;
                        return storeAndValidateAuthResponse(authresponse);
                    } else {
                        return response.data().then((data: any) => {
                            throw new Error(`Could not get user object. Data: ${data}`);
                        });
                    }
                })
                .catch(error => {
                    if (!error.message.includes('Network Error')) {
                        // Error was not Network Error, which means login failed due to invalid credentials.
                        Keychain.resetGenericPassword();
                    }
                    throw error;
                });
        } else {
            throw new Error('No saved credentials found');
        }
    });
}

export const getOrRefreshAccessToken = async (): Promise<string> => {
    const accessToken = await Keychain.getGenericPassword({ service: 'accessToken' })
    const accessTokenExpiry = await Keychain.getGenericPassword({ service: 'accessTokenExpiry' })
    const refreshToken = await Keychain.getGenericPassword({ service: 'refreshToken' });

    if (accessToken && accessTokenExpiry && refreshToken) {
        const tokenExpiryDate = new Date(accessTokenExpiry.password);
        console.log('Access token expiry', tokenExpiryDate);
        console.log('Current time', new Date());
        if (new Date() > new Date(tokenExpiryDate.getTime() - 60 * 1000)) { // refresh 60 seconds before expiry
            try {
                const newAccessToken = await refreshAccessToken(refreshToken.password);
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
            return Promise.all([
                Keychain.resetGenericPassword({ service: 'accessToken' }),
                Keychain.resetGenericPassword({ service: 'credentials' }),
                Keychain.resetGenericPassword({ service: 'accessTokenExpiry' }),
            ]).then(() => Promise.reject('Login failed'));
        });
}

const storeAndValidateAuthResponse = async (authresponse: AuthResponse): Promise<AuthResponse | undefined> => {
    if (authresponse.accessToken && authresponse.refreshToken && authresponse.accessTokenExpiry && authresponse.user) {
        await Keychain.setGenericPassword('accessToken', authresponse.accessToken, {
            service: 'accessToken',
        });
        await Keychain.setGenericPassword('refreshToken', authresponse.refreshToken, {
            service: 'refreshToken',
        });
        await Keychain.setGenericPassword('accessTokenExpiry', authresponse.accessTokenExpiry.toString(), {
            service: 'accessTokenExpiry',
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
