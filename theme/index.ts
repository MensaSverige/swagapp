import {extendTheme, Theme} from 'native-base';
import lightTheme from './light';
import darkTheme from './dark';

export type ThemeMode = 'dark' | 'light';

export const getTheme = (mode: ThemeMode) => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
