import React, { useState } from 'react';
import {
    DefaultTheme,
    NavigationContainer,
    useNavigation,
} from '@react-navigation/native';
import {
    NativeStackNavigationProp,
    createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { LoggedInTabs } from './LoggedInTabs';
import { NonMemberLoggedInTabs } from './NonMemberLoggedInTabs';
import useStore from '../features/common/store/store';
import { SigninForm } from '../features/account/screens/SigninForm';
import { ICustomTheme, useTheme } from 'native-base';
import { NoWifiIcon } from '../features/common/components/NoWifiIcon';
import { NoWifiSpinner } from '../features/common/components/NoWifiSpinner';
import apiClient from '../features/common/services/apiClient';
import { useEffect } from 'react';
import { useColorMode } from '@gluestack-ui/themed';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function useSwagNavigation() {
    return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}

export const RootStackNavigation = () => {
    const { backendConnection, setBackendConnection, user } = useStore();
    const [checkingBackendConnection, setCheckingBackendConnection] =
        useState(false);
    const colorMode = useColorMode();

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        if (!backendConnection) {
            intervalId = setInterval(() => {
                setCheckingBackendConnection(true);
                apiClient
                    .get('/health', { timeout: 200 })
                    .then(() => {
                        setBackendConnection(true);
                    })
                    .catch(error => {
                        if (error.message.includes('Network Error')) {
                            setBackendConnection(false);
                        }
                    })
                    .finally(() => {
                        setCheckingBackendConnection(false);
                    });
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [backendConnection, setBackendConnection, setCheckingBackendConnection]);

    const theme = useTheme() as ICustomTheme;

    const navigationContainerTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: colorMode === 'dark' ? '#171717' : '#ffffff',
        },
    };
    return (
        <>
            <NavigationContainer theme={navigationContainerTheme}>
                <Stack.Navigator initialRouteName="Start">
                    <Stack.Screen
                        name="Start"
                        options={{
                            headerShown: !backendConnection,
                            title: 'Når inte servern',
                            headerStyle: {
                                backgroundColor: theme.colors.background[900],
                            },
                            headerTintColor: theme.colors.text[500],
                            headerRight: checkingBackendConnection
                                ? NoWifiSpinner
                                : NoWifiIcon,
                        }}>
                        {() => {
                            if (user === null) {
                                return <SigninForm />;
                            } else if (user.isMember) {
                                return <LoggedInTabs />;
                            } else {
                                return <NonMemberLoggedInTabs />;
                            }
                        }}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </>
    );
};
