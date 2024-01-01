import {
  NativeBaseProvider,
} from 'native-base';
import {Appearance, ColorSchemeName} from 'react-native';
import React, {useState, useEffect} from 'react';
import {getTheme} from './theme';
import SplashScreen from 'react-native-splash-screen';
import {User} from './types/user';
import useStore from './features/common/store/store';
import * as Keychain from 'react-native-keychain';
import apiClient from './features/common/services/apiClient';
import useUserLocation from './features/map/hooks/useUserLocation';
import {RootStackNavigation} from './navigation/RootStackNavigation';

function App(): JSX.Element {
  useUserLocation();
  const {user, setUser, setIsTryingToLogin} = useStore();

  useEffect(() => {
    if (!user) {
      Keychain.getAllGenericPasswordServices().then(allSavedCredentials => {
        console.log('All saved credentials:', allSavedCredentials);
        if (
          allSavedCredentials.some(
            credential =>
              credential === 'accessToken' ||
              credential === 'refreshToken' ||
              credential === 'credentials',
          )
        ) {
          console.log('Found tokens in keychain, trying to get user object');
          setIsTryingToLogin(true);
          apiClient
            .get('/user/me')
            .then(response => {
              if (response.status === 200) {
                const userData: User = response.data;
                setUser(userData);
              } else {
                return response.data().then((data: any) => {
                  throw new Error(`Could not get user object. Data: ${data}`);
                });
              }
            })
            .catch(error => {
              console.error(error);
              Keychain.resetGenericPassword();
              console.log('Removing tokens from keychain');
            })
            .finally(() => {
              setIsTryingToLogin(false);
            });
        } else {
          console.log('No tokens in keychain');
          setIsTryingToLogin(false);
        }
      });
    }
  }, [user, setUser]);

  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(
    Appearance.getColorScheme(),
  );
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({colorScheme: newColorScheme}) => {
        setColorScheme(newColorScheme);
      },
    );

    return () => subscription.remove();
  }, []);

  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <NativeBaseProvider theme={theme}>
      <RootStackNavigation />
    </NativeBaseProvider>
  );
}

export default App;
