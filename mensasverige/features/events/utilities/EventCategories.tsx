import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Tag } from '../../../api_schema/types';

export interface EventCategory {
  code: string;
  label: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    code: 'F',
    label: 'Föreläsning',
    color: Colors.indigo500,
    icon: 'co-present',
  },
  {
    code: 'Fö',
    label: 'Föreningsarbete',
    color: Colors.primary400,
    icon: 'groups',
  },
  {
    code: 'M',
    label: 'Middag',
    color: Colors.pink600,
    icon: 'restaurant',
  },
  {
    code: 'S',
    label: 'Spel',
    color: '#D97706',
    icon: 'casino',
  },
  {
    code: 'So',
    label: 'Socialt',
    color: Colors.cyan600,
    icon: 'diversity-3',
  },
  {
    code: 'U',
    label: 'Ungdomsaktivitet',
    color: Colors.fuchsia600,
    icon: 'escalator-warning',
  },
  {
    code: 'Up',
    label: 'Uppträdande',
    color: Colors.amber600,
    icon: 'mic',
  },
  {
    code: 'Ut',
    label: 'Utflykt',
    color: Colors.lime600,
    icon: 'explore',
  },
  {
    code: 'W',
    label: 'Workshop',
    color: Colors.purple600,
    icon: 'handyman',
  },
];

const normalize = (s: string) => s.trim().toLowerCase();

const BY_CODE = new Map(EVENT_CATEGORIES.map(c => [c.code, c]));
const BY_LABEL = new Map(EVENT_CATEGORIES.map(c => [normalize(c.label), c]));

export const getCategoryByCode = (code: string): EventCategory | undefined => BY_CODE.get(code);

/**
 * The code to use for a tag: a known category's, matched by code first and
 * then by label, so a category whose code we don't know (e.g. "Socialt")
 * still maps. Falls back to the tag's own code.
 */
export const canonicalCategoryCode = (tag: Pick<Tag, 'code' | 'text'>): string =>
  (BY_CODE.get(tag.code) ?? BY_LABEL.get(normalize(tag.text)))?.code ?? tag.code;

