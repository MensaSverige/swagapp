import apiClient from '../../common/services/apiClient';
import { User } from '../types/user';
import * as Keychain from 'react-native-keychain';

interface LoginResponse {
    user: User;
    access_token: string;
    refresh_token: string;
  }
  
  interface ErrorResponse {
    message: string;
  }
  export interface AuthRequest {
    username: string;
    password: string;
}
export const authenticate = async (authRequest: AuthRequest, testMode: boolean) => {
    //console.log('Authenticating', authRequest);
    console.log('API_URL', apiClient.defaults.baseURL);
    return apiClient
        .post('/authm', authRequest)
        .then(async response => {
            if (response.status === 200) {
                const data: LoginResponse = response.data;
                const responseUser: User = data.user;

                if (data.access_token && data.refresh_token) {
                    return Promise.all([
                        Keychain.setGenericPassword('accessToken', data.access_token, {
                            service: 'accessToken',
                        }),
                        Keychain.setGenericPassword('refreshToken', data.refresh_token, {
                            service: 'refreshToken',
                        }),
                    ]).catch(error => {
                        console.error('Keychain error', error);
                        throw new Error('Något gick fel. Kunde inte spara dina inloggningsuppgifter.');
                    });
                } else {
                    console.error('Received null accessToken or refreshToken');
                    throw new Error('Något gick fel. Försök igen senare.');
                }
            } else {
                if (response.status === 401) {
                    console.error('Invalid credentials');
                    throw new Error('Fel användarnamn eller lösenord.');
                } else if (response.status === 400) {
                    const data: ErrorResponse = response.data;
                    if (data.message === 'Test mode is not enabled') {
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