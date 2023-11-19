import {extendTheme} from 'native-base';

const baseTheme = extendTheme({
    colors: {
        primary:  {
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
        // primary:  {
        //     50: '#e3f3fe',
        //     100: '#0a1216', 
        //     200: '#14242c', 
        //     300: '#1d3741', 
        //     400: '#274957', 
        //     500: '#315c6e', 
        //     600: '#47849e', 
        //     700: '#6da5be', 
        //     800: '#9ec3d3', 
        //     900: '#cee1e9' 
        // },
        secondary: {
            50: '#060a10', 
            100: '#060a10', 
            200: '#0b141f', 
            300: '#111e2f', 
            400: '#17273f', 
            500: '#1c314e', 
            600: '#32568a', 
            700: '#4d7dbf', 
            800: '#89a8d4', 
            900: '#c4d4ea' 
        }
    }
});
// --charcoal: #193849ff;
// --rich-black: #0B1B27ff;
// --earth-yellow: #EFBE7Eff;
// --paynes-gray: #315C6Eff;
// --baby-powder: #FFFFF8ff;
//{ 'oxford_blue': { DEFAULT: '#08172E', 100: '#02050a', 200: '#030a13', 300: '#050e1d', 400: '#071326', 500: '#08172e', 600: '#163f7d', 700: '#2466ca', 800: '#6598e4', 900: '#b2cbf1' }, 'earth_yellow': { DEFAULT: '#F0BA6B', 100: '#3f2806', 200: '#7e510c', 300: '#bd7913', 400: '#ea9e2b', 500: '#f0ba6b', 600: '#f3c888', 700: '#f6d6a6', 800: '#f9e4c4', 900: '#fcf1e1' }, 'prussian_blue': { DEFAULT: '#1C314E', 100: '#060a10', 200: '#0b141f', 300: '#111e2f', 400: '#17273f', 500: '#1c314e', 600: '#32568a', 700: '#4d7dbf', 800: '#89a8d4', 900: '#c4d4ea' }, 'baby_powder': { DEFAULT: '#FEFEFA', 100: '#545411', 200: '#a9a921', 300: '#dddd52', 400: '#ededa6', 500: '#fefefa', 600: '#fefefc', 700: '#fefefc', 800: '#fffffd', 900: '#fffffe' } }

// { 'charcoal': { DEFAULT: '#193849', 100: '#050b0e', 200: '#0a161d', 300: '#0f212b', 400: '#142c3a', 500: '#193849', 600: '#2e6786', 700: '#4695c0', 800: '#84b9d5', 900: '#c1dcea' }, 'rich_black': { DEFAULT: '#0B1B27', 100: '#020508', 200: '#040b10', 300: '#071018', 400: '#091620', 500: '#0b1b27', 600: '#1f4d6f', 700: '#347eb7', 800: '#70aad7', 900: '#b7d5eb' }, 'earth_yellow': { DEFAULT: '#EFBE7E', 100: '#412908', 200: '#835110', 300: '#c47a18', 400: '#e79e3f', 500: '#efbe7e', 600: '#f2cc99', 700: '#f6d9b3', 800: '#f9e5cc', 900: '#fcf2e6' }, 'payne's_gray': { DEFAULT: '#315C6E', 100: '#0a1216', 200: '#14242c', 300: '#1d3741', 400: '#274957', 500: '#315c6e', 600: '#47849e', 700: '#6da5be', 800: '#9ec3d3', 900: '#cee1e9' }, 'baby_powder': { DEFAULT: '#FFFFF8', 100: '#656500', 200: '#caca00', 300: '#ffff30', 400: '#ffff95', 500: '#fffff8', 600: '#fffffb', 700: '#fffffc', 800: '#fffffd', 900: '#fffffe' } }

export default baseTheme;
