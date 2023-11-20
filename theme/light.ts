import {extendTheme} from 'native-base';
import baseTheme from './base';

const lightTheme = extendTheme({
  ...baseTheme,
  config: {
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
  components: {
    Center: {
      defaultProps: {
        bg: 'muted.100',
      },
    },
    Heading: {
      defaultProps: {
        color: 'text.900',
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'primary',
        bg: 'primary.500',
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.800',
      },
    },
    Card: {
      baseStyle: {
        borderColor: 'muted.500',
        borderWidth: 1,
        backgroundColor: 'primary.900',
      },
    },
    Input: {
      defaultProps: {
        bg: 'transparent',
        borderColor: 'muted.500',
        placeholderTextColor: 'text.600',
        _focus: {
          borderColor: 'primary.500',
          placeholderTextColor: 'text.600',
          _hover: {borderColor: 'primary.500'},
        },
        Heading: {
          defaultProps: {
            color: 'text.900',
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
            color: 'gray.800',
          },
        },
        Input: {
          defaultProps: {
            bg: 'transparent',
            borderColor: 'muted.500',
            placeholderTextColor: 'text.600',
            _focus: {
              borderColor: 'primary.500',
              placeholderTextColor: 'text.600',
              _hover: {borderColor: 'primary.500'},
            },
          },
        },
      },
    },
  },
});

export default lightTheme;
