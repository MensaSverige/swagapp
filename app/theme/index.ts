import lightTheme from './light';
import darkTheme from './dark';

export type ThemeMode = 'dark' | 'light';

type LightThemeType = typeof lightTheme;
type DarkThemeType = typeof darkTheme;

declare module 'native-base' {
  interface ICustomTheme extends LightThemeType, DarkThemeType {}
}

export const getTheme: (
  mode: ThemeMode,
) => LightThemeType | DarkThemeType = mode => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
