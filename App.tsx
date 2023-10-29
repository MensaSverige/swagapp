import { NativeBaseProvider, extendTheme } from 'native-base';
import { Appearance, ColorSchemeName } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SigninForm } from './components/SigninForm';
import { getTheme} from './theme';
import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import SwagMap from './components/SwagMap';
import SplashScreen from 'react-native-splash-screen';


const Stack = createNativeStackNavigator();

function App(): JSX.Element {

  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(Appearance.getColorScheme());
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <NativeBaseProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Signin">
          <Stack.Screen
            name="Signin"
            component={SigninForm}
            options={{ 
              headerTitle: 'Logga in', 
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="SwagMap"
            component={SwagMap}
            options={{ title: 'Swagmap' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
}

export default App;
