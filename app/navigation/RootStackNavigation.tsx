import React, {useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './RootStackParamList';
import {LoggedInTabs} from './LoggedInTabs';
import useStore from '../features/common/store/store';
import {LoadingScreen} from '../features/common/screens/LoadingScreen';
import {SigninForm} from '../features/account/screens/SigninForm';
import {ICustomTheme, useTheme} from 'native-base';
import {NoWifiIcon} from '../features/common/components/NoWifiIcon';
import {NoWifiSpinner} from '../features/common/components/NoWifiSpinner';
import apiClient from '../features/common/services/apiClient';
import {useEffect} from 'react';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigation = () => {
  const {backendConnection, setBackendConnection, user, isTryingToLogin} =
    useStore();
  const [checkingBackendConnection, setCheckingBackendConnection] =
    useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (!backendConnection) {
      intervalId = setInterval(() => {
        setCheckingBackendConnection(true);
        apiClient
          .get('health')
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
  return (
    <>
      <NavigationContainer>
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
              if (isTryingToLogin) {
                return <LoadingScreen />;
              } else if (user === null) {
                return <SigninForm />;
              } else {
                return <LoggedInTabs />;
              }
            }}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};
