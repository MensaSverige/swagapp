import {Center, NativeBaseProvider, Spinner, useTheme} from 'native-base';
import {Appearance, ColorSchemeName} from 'react-native';
import React, {useState, useEffect} from 'react';
import {SigninForm} from './components/SigninForm';
import {getTheme} from './theme';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MapView from './components/Map';
import SplashScreen from 'react-native-splash-screen';
import {User} from './types/user';
import Profile from './components/Profile';
import useStore from './store/store';
import Events from './components/Events';
import * as Keychain from 'react-native-keychain';
import apiClient from './apiClient';

import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faMapLocationDot,
  faCalendarDays,
  faAddressCard,
} from '@fortawesome/free-solid-svg-icons';
import useUserLocation from './hooks/useUserLocation';

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const MapIcon: React.FC<TabBarIconProps> = ({color, size}) => (
  <FontAwesomeIcon color={color} size={size} icon={faMapLocationDot} />
);

const CalendarIcon: React.FC<TabBarIconProps> = ({color, size}) => (
  <FontAwesomeIcon color={color} size={size} icon={faCalendarDays} />
);

const ProfileIcon: React.FC<TabBarIconProps> = ({color, size}) => (
  <FontAwesomeIcon color={color} size={size} icon={faAddressCard} />
);

function LoggedInTabs() {
  const theme = useTheme();
  const screenOptions = {
    tabBarStyle: {
      backgroundColor: theme.colors.background[900],
    },
    tabBarActiveTintColor: theme.colors.primary[50],
    tabBarInactiveTintColor: theme.colors.primary[900],
    tabBarShowLabel: true,
    headerStyle: {
      backgroundColor: theme.colors.background[900],
    },
    headerTintColor: theme.colors.primary[500],
  };
  return (
    <BottomTab.Navigator screenOptions={screenOptions}>
      <BottomTab.Screen
        name="Karta"
        component={MapView}
        options={{
          tabBarIcon: MapIcon,
        }}
      />
      <BottomTab.Screen
        name="Evenemang"
        component={Events}
        options={{
          tabBarIcon: CalendarIcon,
        }}
      />
      <BottomTab.Screen
        name="Profil"
        component={Profile}
        options={{
          tabBarIcon: ProfileIcon,
        }}
      />
    </BottomTab.Navigator>
  );
}

const LoadingScreen: React.FC = () => (
  <Center w="100%" h="100%">
    <Spinner size="lg" />
  </Center>
);

function App(): JSX.Element {
  useUserLocation();
  const [isTryingToLogin, setIsTryingToLogin] = useState(false);
  const {user, setUser} = useStore();

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
                Keychain.resetGenericPassword();
                console.log('Removing tokens from keychain');
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
    }
  }, [user, setUser]);

  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(
    Appearance.getColorScheme(),
  );
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <NativeBaseProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Start">
          <Stack.Screen name="Start" options={{headerShown: false}}>
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
    </NativeBaseProvider>
  );
}

export default App;
