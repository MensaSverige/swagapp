import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

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

// Helper function to get category by code
export const getCategoryByCode = (code: string): EventCategory | undefined => {
  return EVENT_CATEGORIES.find(category => category.code === code);
};

