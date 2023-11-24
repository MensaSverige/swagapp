import {extendTheme} from 'native-base';
import baseTheme from './base';

const lightTheme = extendTheme({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    background: {
      50: '#ffffff',
      100: '#ffffff',
      200: '#ffffff',
      300: '#ffffff',
      400: '#ffffff',
      500: '#ffffff',
      600: '#f9f9f9',
      700: '#f2f2f2',
      800: '#ececec',
      900: '#e6e6e6',
    },
    text: {
      50: '#5b5b5b',
      100: '#545454',
      200: '#4d4d4d',
      300: '#464646',
      400: '#404040',
      500: '#3B3B3B',
      600: '#333333',
      700: '#2c2c2c',
      800: '#262626',
      900: '#202020',
    },
    primary: {
      50: '#006fd7',
      100: '#006bd0',
      200: '#0068c9',
      300: '#0064c2',
      400: '#0061bb',
      500: '#005FB8',
      600: '#0059ae',
      700: '#0056a7',
      800: '#0052a1',
      900: '#004f9a',
    },
    secondary: {
      50: '#f5f5f5',
      100: '#f1f1f1',
      200: '#eeeeee',
      300: '#eaeaea',
      400: '#e7e7e7',
      500: '#e5e5e5',
      600: '#e0e0e0',
      700: '#dcdcdc',
      800: '#d9d9d9',
      900: '#d5d5d5',
    },
    accent: {
      50: '#0365c0',
      100: '#0362bb',
      200: '#035fb6',
      300: '#035db1',
      400: '#035aac',
      500: '#0258A8',
      600: '#0254a2',
      700: '#02519e',
      800: '#024f99',
      900: '#024c94',
    },
  },
  config: {
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
  components: {
    ...baseTheme.components,
  },
});

export default lightTheme;
