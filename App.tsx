import {NativeBaseProvider} from 'native-base';
import {Appearance, ColorSchemeName} from 'react-native';
import React, {useState, useEffect} from 'react';
import {SigninForm} from './components/SigninForm';
import {getTheme} from './theme';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import SwagMap from './components/SwagMap';
import SplashScreen from 'react-native-splash-screen';
import {User} from './types/user';
import Profile from './components/Profile';
import Icon from 'react-native-vector-icons/Ionicons';
import useStore from './store';

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

function LoggedInTabs() {
  return (
    <BottomTab.Navigator>
      <BottomTab.Screen
        name="Karta"
        component={SwagMap}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Profil"
        component={Profile}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

function App(): JSX.Element {
  const user: User | null = useStore(state => state.user);

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
        <Stack.Navigator initialRouteName="Signin">
          {user === null ? (
            <Stack.Screen
              name="Signin"
              component={SigninForm}
              options={{
                headerTitle: 'Logga in',
                headerShown: false,
              }}
            />
          ) : (
            <Stack.Screen
              name="Tab View"
              component={LoggedInTabs}
              options={{headerShown: false}}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
}

export default App;
