import React from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './RootStackParamList';
import {LoggedInTabs} from './LoggedInTabs';
import useStore from '../features/common/store/store';
import {LoadingScreen} from '../features/common/screens/LoadingScreen';
import {SigninForm} from '../features/account/screens/SigninForm';
import {ICustomTheme, useTheme} from 'native-base';
import {NoWifiIcon} from '../features/common/components/NoWifiIcon';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigation = () => {
  const {backendConnection, user, isTryingToLogin} = useStore();
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
              headerRight: NoWifiIcon,
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
