import {extendTheme} from 'native-base';
import baseTheme from './base';

const darkTheme = extendTheme({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    background: {
      50: '#08142A',
      100: '#08142A',
      200: '#08142A',
      300: '#08142A',
      400: '#08142A',
      500: '#08142A',
      600: '#08142A',
      700: '#08142A',
      800: '#08142A',
      900: '#08142A',
    },
    text: {
      50: '#ffffff',
      100: '#ffffff',
      200: '#ffffff',
      300: '#ffffff',
      400: '#ffffff',
      500: '#ffffff',
      600: '#ffffff',
      700: '#ffffff',
      800: '#ffffff',
      900: '#ffffff',
    },
    icon: {
      50: '#e3f3fe',
      100: '#bbdfff',
      200: '#8eccff',
      300: '#5fb8ff',
      400: '#38a8ff',
      500: '#0099FF', ///mensablå
      600: '#048bf1',
      700: '#0478dd',
      800: '#0467cb',
      900: '#0248ac',
    },
  },
  config: {
    useSystemColorMode: false,
    initialColorMode: 'dark',
  },
  components: {
    Header: {
      defaultProps: {
        bg: '#08142A', //oxford_blue
      },
    },
    TabBar: {
      baseStyle: {
        backgroundColor: '#08142A',
      },
    },

    Center: {
      defaultProps: {
        bg: '#08142A', //oxford_blue
      },
    },
    Heading: {
      defaultProps: {
        color: 'text.50',
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'primary',
        _text: {color: 'white'},
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.200',
      },
    },
    Checkbox: {
      baseStyle: {
        color: 'text.50',
      },
    },
    Card: {
      baseStyle: {
        borderColor: 'muted.500',
        borderWidth: 1,
        backgroundColor: 'primary.400',
      },
    },
    Input: {
      defaultProps: {
        bg: 'transparent',
        borderColor: 'muted.500',
        placeholderTextColor: 'text.400',
        _focus: {
          borderColor: 'primary.600',
          backgroundColor: 'darkblue.700',
          placeholderTextColor: 'text.100',
          _hover: {borderColor: 'primary.600'},
        },
        Heading: {
          defaultProps: {
            color: 'text.50',
          },
        },
        Button: {
          defaultProps: {
            colorScheme: 'secondary',
            _text: {color: 'white'},
          },
        },
        Text: {
          baseStyle: {
            color: 'gray.200',
          },
        },
        Input: {
          defaultProps: {
            bg: 'transparent',
            borderColor: 'muted.500',
            placeholderTextColor: 'text.400',
            _focus: {
              color: 'text.50',
              borderColor: 'primary.600',
              backgroundColor: 'darkblue.700',
              placeholderTextColor: 'text.100',
              _hover: {borderColor: 'primary.600'},
            },
          },
        },
        IconButton: {
          defaultProps: {
            colorScheme: 'primary',
          },
        },
      },
    },
  },
});
export default darkTheme;
