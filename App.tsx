import { NativeBaseProvider, extendTheme } from 'native-base';
import { Appearance, ColorSchemeName } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SignupForm } from './components/SigninForm';
import { getTheme} from './theme';

function App(): JSX.Element {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <NativeBaseProvider theme={theme}>
      <SignupForm />
    </NativeBaseProvider>
  );
}

export default App;
