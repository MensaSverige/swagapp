import {extendTheme} from 'native-base';
import baseTheme from './base';

const darkTheme = extendTheme({
  ...baseTheme,
  config: {
    useSystemColorMode: false,
    initialColorMode: 'dark',
  },
  components: {
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
      },
    },
    IconButton: {
      defaultProps: {
        colorScheme: 'primary',
      },
    },
  },
});
export default darkTheme;
