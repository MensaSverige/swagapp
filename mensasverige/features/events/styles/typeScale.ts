import { TextStyle } from 'react-native';

/** Shared type scale for the event screens. Colours are applied by the components. */
export const typeScale = {
  eventHeaderTitle: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  listTitle: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 14 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 13, fontWeight: '500' },
  link: { fontSize: 15, fontWeight: '500' },
  button: { fontSize: 17, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

export const PAGE_PADDING = 16;
export const BUTTON_HEIGHT = 48;
export const EVENT_HEADER_HEIGHT = 56;
export const EVENT_HEADER_BG = '#005DB4';
export const DIVIDER_COLOR = '#E5E7EB';
