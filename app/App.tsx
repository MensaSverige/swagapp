import {NativeBaseProvider} from 'native-base';
import {Appearance, ColorSchemeName} from 'react-native';
import React, {useState, useEffect} from 'react';
import {getTheme} from './theme';
import SplashScreen from 'react-native-splash-screen';
import useUserLocation from './features/map/hooks/useUserLocation';
import {RootStackNavigation} from './navigation/RootStackNavigation';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { gluestackUIConfig } from './gluestack-components/gluestack-ui.config';
import { COLORMODES } from '@gluestack-style/react/lib/typescript/types';

function App(): JSX.Element {
  useUserLocation();

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
      <GluestackUIProvider colorMode={colorScheme as COLORMODES} config={gluestackUIConfig}>
      <RootStackNavigation />
      </GluestackUIProvider>
    </NativeBaseProvider>
  );
}

export default App;
