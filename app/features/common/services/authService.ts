import { AuthRequest, AuthResponse, HTTPValidationError, User, ValidationError } from '../../../api_schema/types';
import apiClient from '../../common/services/apiClient';

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
                if (data.token && data.user) {

                    await Keychain.setGenericPassword('accessToken', data.token, {
                        service: 'accessToken',
                    });

                    if (data.user !== null && data.user !== undefined) {
                        const user: User = data.user;
                        return user;
                    } else {
                        throw new Error('User data is undefined');
                    }
                } else {
                    console.error('Received null accessToken');
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