/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Colors extracted from gluestack configuration for consistent theming.
 */

const tintColorLight = '#0077E6'; // primary500
const tintColorDark = '#4FC1FF'; // primary500 dark theme

// Base color palette from gluestack
const baseColors = {
  // Rose colors
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  rose700: '#be123c',
  rose800: '#9f1239',
  rose900: '#881337',

  // Pink colors
  pink50: '#fdf2f8',
  pink100: '#fce7f3',
  pink200: '#fbcfe8',
  pink300: '#f9a8d4',
  pink400: '#f472b6',
  pink500: '#ec4899',
  pink600: '#db2777',
  pink700: '#be185d',
  pink800: '#9d174d',
  pink900: '#831843',

  // Purple colors
  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple200: '#e9d5ff',
  purple300: '#d8b4fe',
  purple400: '#c084fc',
  purple500: '#a855f7',
  purple600: '#9333ea',
  purple700: '#7e22ce',
  purple800: '#6b21a8',
  purple900: '#581c87',

  // Blue colors
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue300: '#93c5fd',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue800: '#1e40af',
  blue900: '#1e3a8a',

  // Green colors
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green300: '#86efac',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  green900: '#14532d',

  // Yellow/Amber colors
  yellow50: '#fefce8',
  yellow100: '#fef9c3',
  yellow200: '#fef08a',
  yellow300: '#fde047',
  yellow400: '#facc15',
  yellow500: '#eab308',
  yellow600: '#ca8a04',
  yellow700: '#a16207',
  yellow800: '#854d0e',
  yellow900: '#713f12',

  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber300: '#fcd34d',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  amber800: '#92400e',
  amber900: '#78350f',

  // Orange colors
  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  orange300: '#fdba74',
  orange400: '#fb923c',
  orange500: '#f97316',
  orange600: '#ea580c',
  orange700: '#c2410c',
  orange800: '#9a3412',
  orange900: '#7c2d12',

  // Red colors
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red300: '#fca5a5',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  red800: '#991b1b',
  red900: '#7f1d1d',

  // Gray variants
  warmGray50: '#fafaf9',
  warmGray100: '#f5f5f4',
  warmGray200: '#e7e5e4',
  warmGray300: '#d6d3d1',
  warmGray400: '#a8a29e',
  warmGray500: '#78716c',
  warmGray600: '#57534e',
  warmGray700: '#44403c',
  warmGray800: '#292524',
  warmGray900: '#1c1917',

  trueGray50: '#fafafa',
  trueGray100: '#f5f5f5',
  trueGray200: '#e5e5e5',
  trueGray300: '#d4d4d4',
  trueGray400: '#a3a3a3',
  trueGray500: '#737373',
  trueGray600: '#525252',
  trueGray700: '#404040',
  trueGray800: '#262626',
  trueGray900: '#171717',

  coolGray50: '#f9fafb',
  coolGray100: '#f3f4f6',
  coolGray200: '#e5e7eb',
  coolGray300: '#d1d5db',
  coolGray400: '#9ca3af',
  coolGray500: '#6b7280',
  coolGray600: '#4b5563',
  coolGray700: '#374151',
  coolGray800: '#1f2937',
  coolGray900: '#111827',

  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  teal200: '#99f6e4',
  teal300: '#5eead4',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',

  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
};

// Primary brand colors
const primaryColors = {
  primary0: '#E5F1FB',
  primary50: '#CCE9FF',
  primary100: '#ADDBFF',
  primary200: '#7CC2FF',
  primary300: '#4AA9FF',
  primary400: '#1A91FF',
  primary500: '#0077E6',
  primary600: '#005DB4',
  primary700: '#004282',
  primary800: '#002851',
  primary900: '#011838',
  primary950: '#000711',
};

// Secondary brand colors
const secondaryColors = {
  secondary0: '#58e3c7',
  secondary100: '#56ddc2',
  secondary200: '#53d7bd',
  secondary300: '#51d2b8',
  secondary400: '#4fccb3',
  secondary500: '#4ec9b0',
  secondary600: '#4bc1a9',
  secondary700: '#48bba4',
  secondary800: '#46b69f',
  secondary900: '#44b09a',
};

// Semantic colors
const semanticColors = {
  // Error colors
  error00: '#FEE9E9',
  error50: '#FEE2E2',
  error100: '#FECACA',
  error200: '#FCA5A5',
  error300: '#F87171',
  error400: '#EF4444',
  error500: '#E63535',
  error600: '#DC2626',
  error700: '#B91C1C',
  error800: '#7F1D1D',
  error900: '#991B1B',
  error950: '#220808',

  // Success colors
  success0: '#E4FFF4',
  success50: '#CAFFE8',
  success100: '#A2F1C0',
  success200: '#84D3A2',
  success300: '#66B584',
  success400: '#489766',
  success500: '#348352',
  success600: '#2A7948',
  success700: '#206F3E',
  success800: '#166534',
  success900: '#14532D',
  success950: '#071F11',

  // Warning colors
  warning50: '#fff7ed',
  warning100: '#ffedd5',
  warning200: '#fed7aa',
  warning300: '#fdba74',
  warning400: '#fb923c',
  warning500: '#f97316',
  warning600: '#ea580c',
  warning700: '#c2410c',
  warning800: '#9a3412',
  warning900: '#7c2d12',

  // Info colors
  info50: '#f0f9ff',
  info100: '#e0f2fe',
  info200: '#bae6fd',
  info300: '#7dd3fc',
  info400: '#38bdf8',
  info500: '#0ea5e9',
  info600: '#0284c7',
  info700: '#0369a1',
  info800: '#075985',
  info900: '#0c4a6e',
};

// Text colors
const textColors = {
  text0: '#FCFCFC',
  text50: '#F5F5F5',
  text100: '#E5E5E5',
  text200: '#DBDBDB',
  text300: '#D4D4D4',
  text400: '#A3A3A3',
  text500: '#8C8C8C',
  text600: '#737373',
  text700: '#525252',
  text800: '#404040',
  text900: '#262626',
  text950: '#171717',
};

// Background colors
const backgroundColors = {
  background0: '#ffffff',
  background50: '#F5F5F5',
  background100: '#F1F1F1',
  background200: '#DBDBDB',
  background300: '#D4D4D4',
  background400: '#A3A3A3',
  background500: '#8C8C8C',
  background600: '#737373',
  background700: '#525252',
  background800: '#404040',
  background900: '#262626',
  background950: '#171717',

  backgroundLightError: '#FEF1F1',
  backgroundDarkError: '#422B2B',
  backgroundLightWarning: '#FFF4EB',
  backgroundDarkWarning: '#412F23',
  backgroundLightSuccess: '#EDFCF2',
  backgroundDarkSuccess: '#1C2B21',
  backgroundLightInfo: '#EBF8FE',
  backgroundDarkInfo: '#1A282E',
  backgroundLightMuted: '#F6F6F7',
  backgroundDarkMuted: '#252526',
};

// VSCode syntax highlighting colors
const vscodeColors = {
  vscode_newOperator: '#AF00DB',
  vscode_stringLiteral: '#a31515',
  vscode_customLiteral: '#795E26',
  vscode_numberLiteral: '#098658',
  vscode_typeDeclaration: '#267f99',
  vscode_var: '#001080',
  vscode_const: '#0070C1',
};

// VSCode dark theme colors
const vscodeDarkColors = {
  vscode_newOperator: '#C586C0',
  vscode_stringLiteral: '#ce9178',
  vscode_customLiteral: '#DCDCAA',
  vscode_numberLiteral: '#b5cea8',
  vscode_typeDeclaration: '#4EC9B0',
  vscode_var: '#9CDCFE',
  vscode_const: '#4FC1FF',
};

// Special colors
const specialColors = {
  news_title: '#d97706', // amber600
  news_title_dark: '#C586C0', // vscode_newOperator for dark theme
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    // Brand colors
    ...primaryColors,
    ...secondaryColors,

    // Base color palette
    ...baseColors,

    // Semantic colors
    ...semanticColors,

    // Text colors
    ...textColors,

    // Background colors
    ...backgroundColors,

    // VSCode colors
    ...vscodeColors,

    // Special colors
    ...specialColors,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // Primary colors (dark theme variants)
    primary0: '#CCFBFF',
    primary50: '#B7F1FF',
    primary100: '#A2E8FF',
    primary200: '#8EDEFF',
    primary300: '#79D4FF',
    primary400: '#64CBFF',
    primary500: '#4FC1FF',
    primary600: '#40A4DF',
    primary700: '#3187C0',
    primary800: '#216AA0',
    primary900: '#124D80',

    // Secondary colors (dark theme variants)
    secondary0: '#9EDCCF',
    secondary100: '#83D6C5',
    secondary200: '#76D3C0',
    secondary300: '#69CFBA',
    secondary400: '#5BCCB5',
    secondary500: '#4ec9b0',
    secondary600: '#41B099',
    secondary700: '#349782',
    secondary800: '#277D6B',
    secondary900: '#1A6454',

    // Base colors (same for dark theme)
    ...baseColors,

    // Semantic colors (same for dark theme)
    ...semanticColors,

    // Text colors (inverted for dark theme)
    text0: '#171717',
    text50: '#262626',
    text100: '#404040',
    text200: '#525252',
    text300: '#737373',
    text400: '#8C8C8C',
    text500: '#A3A3A3',
    text600: '#D4D4D4',
    text700: '#DBDBDB',
    text800: '#E5E5E5',
    text900: '#F5F5F5',
    text950: '#FCFCFC',

    // Background colors (dark theme variants)
    background0: '#171717',
    background50: '#262626',
    background100: '#404040',
    background200: '#525252',
    background300: '#737373',
    background400: '#8C8C8C',
    background500: '#A3A3A3',
    background600: '#D4D4D4',
    background700: '#DBDBDB',
    background800: '#F1F1F1',
    background900: '#F5F5F5',
    background950: '#FCFCFC',

    backgroundError: '#422B2B',
    backgroundWarning: '#412F23',
    backgroundSuccess: '#1C2B21',
    backgroundInfo: '#1A282E',
    backgroundMuted: '#252526',

    // VSCode dark colors
    ...vscodeDarkColors,

    // Special colors (dark variants)
    news_title: specialColors.news_title_dark,

    // Amber colors (lighter for dark theme)
    amber50: '#ffffff',
    amber100: '#ffffff',
    amber200: '#fffbeb',
    amber300: '#fef3c7',
    amber400: '#fde68a',
    amber500: '#fcd34d',
    amber600: '#fbbf24',
    amber700: '#f59e0b',
    amber800: '#d97706',
    amber900: '#b45309',

    // Info colors (inverted for dark theme)
    info50: '#0c4a6e',
    info100: '#075985',
    info200: '#0369a1',
    info300: '#0284c7',
    info400: '#0ea5e9',
    info500: '#38bdf8',
    info600: '#7dd3fc',
    info700: '#bae6fd',
    info800: '#e0f2fe',
    info900: '#f0f9ff',
  },

  // Expose base colors for direct access
  ...baseColors,
  ...primaryColors,
  ...secondaryColors,
  ...semanticColors,
  ...textColors,
  ...backgroundColors,
  ...vscodeColors,
  ...specialColors,
};
