import React from 'react-native';
import {ICustomTheme, Spinner, useTheme} from 'native-base';

export const NoWifiSpinner = () => {
  const theme = useTheme() as ICustomTheme;
  return <Spinner size="sm" color={theme.colors.text[500]} />;
};
