import { AuthRequest, AuthResponse, HTTPValidationError, User, ValidationError } from '../../../api_schema/types';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import apiClient from '../../common/services/apiClient';
import {UserCredentials} from 'react-native-keychain';
import * as Keychain from 'react-native-keychain';


export const authenticate = async (username: string, password: string, testMode: boolean): Promise<User | undefined> => {
    return apiClient
        .post('/authm', 
        {
            username: username,
            password: password,
        } as AuthRequest
        )
        .then(async response => {
            if (response.status === 200) {
                const data: AuthResponse = response.data;
                console.log('Auth response', data);
                if (data.accessToken && data.refreshToken && data.user) {

                    await Keychain.setGenericPassword('accessToken', data.accessToken, {
                        service: 'accessToken',
                    });
                    await Keychain.setGenericPassword('refreshToken', data.refreshToken, {
                        service: 'refreshToken',
                    });

                    if (data.user !== null && data.user !== undefined) {
                        const user: User = data.user;
                        return user;
                    } else {
                        throw new Error('User data is undefined');
                    }
                } else {
                    console.error('Received null accessToken or refreshToken');
                    throw new Error('Något gick fel. Försök igen senare.');
                }

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

export const attemptLoginWithStoredCredentials = async (): Promise<User | undefined> => {
    return Keychain.getGenericPassword({service: 'credentials'})
      .then((credentials: UserCredentials | false) => {
        if (credentials) {
            return authenticate(credentials.username, credentials.password, false);
        }
        throw new Error('No stored credentials');
      })
      .catch((error: Error) => {
        console.error('Login with stored credentials failed', error);
        return Promise.all([
          Keychain.resetGenericPassword({service: 'accessToken'}),
          Keychain.resetGenericPassword({service: 'credentials'}),
        ]).then(() => Promise.reject('Login failed'));
      });
}