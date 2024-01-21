import {Center, NativeBaseProvider, Text} from 'native-base';
import {Appearance, ColorSchemeName} from 'react-native';
import React, {useState, useEffect} from 'react';
import {getTheme} from './theme';
import SplashScreen from 'react-native-splash-screen';
import {User} from './features/common/types/user';
import useStore from './features/common/store/store';
import * as Keychain from 'react-native-keychain';
import apiClient from './features/common/services/apiClient';
import useUserLocation from './features/map/hooks/useUserLocation';
import {RootStackNavigation} from './navigation/RootStackNavigation';

function App(): JSX.Element {
  useUserLocation();
  const {
    backendConnection,
    setBackendConnection,
    user,
    setUser,
    setIsTryingToLogin,
  } = useStore();

  const [timeLeft, setTimeLeft] = useState(5);
  const countdownTimer = React.useRef<NodeJS.Timeout | null>(null);
  const retryTimer = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user && backendConnection) {
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
              if (!error.message.includes('Network Error')) {
                Keychain.resetGenericPassword();
                console.log('Removed tokens from keychain');
              }
            })
            .finally(() => {
              setIsTryingToLogin(false);
            });
        } else {
          console.log('No tokens in keychain');
          setIsTryingToLogin(false);
        }
      });
    } else if (!user && !backendConnection) {
      retryTimer.current && clearInterval(retryTimer.current);
      countdownTimer.current && clearInterval(countdownTimer.current);
      setTimeLeft(5);
      retryTimer.current = setTimeout(() => {
        setBackendConnection(true);
        //invalidate
        retryTimer.current && clearInterval(retryTimer.current);
      }, 5000);
      countdownTimer.current = setInterval(() => {
        // Get remaining time on retryTimer
        setTimeLeft(prevTimeLeft => prevTimeLeft - 1);
      }, 1000);
    }
  }, [user, setUser, backendConnection, setTimeLeft, setBackendConnection]);

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
      {!user && !backendConnection && (
        <Center w="100%" h="100%">
          <Text>Det går inte att nå servern just nu.</Text>
          <Text>
            Försöker igen om {timeLeft} sekund{timeLeft !== 1 ? 'er' : ''}
          </Text>
        </Center>
      )}
      {(user || backendConnection) && <RootStackNavigation />}
    </NativeBaseProvider>
  );
}

export default App;
