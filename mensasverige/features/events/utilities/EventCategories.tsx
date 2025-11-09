import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import {
  LectureBadge,
  GlobeBadge,
  RestaurantBadge,
  GameBadge,
  TeenBadge,
  MicVocalBadge,
  ExploreBadge,
  WorkshopBadge,
} from '../components/EventBadges';
import { Colors } from '@/constants/Colors';

export interface EventCategory {
  code: string;
  label: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  BadgeComponent: React.FC<{ color: string; size?: number }>;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    code: 'F',
    label: 'Föreläsning',
    color: Colors.indigo500, // föreläsning
    icon: 'co-present',
    BadgeComponent: LectureBadge,
  },
  {
    code: 'Fö',
    label: 'Föreningsarbete',
    color: Colors.primary400, // föreningsarbete
    icon: 'groups',
    BadgeComponent: GlobeBadge,
  },
  {
    code: 'M',
    label: 'Middag/Festligheter',
    color: Colors.pink600, // middag/festligheter
    icon: 'restaurant',
    BadgeComponent: RestaurantBadge,
  },
  {
    code: 'S',
    label: 'Spel/Tävling',
    color: '#D97706', // spel/tävling
    icon: 'casino',
    BadgeComponent: GameBadge,
  },
  {
    code: 'U',
    label: 'Ungdomsaktivitet',
    color: Colors.fuchsia600, // ungdomsaktivitet
    icon: 'escalator-warning',
    BadgeComponent: TeenBadge,
  },
  {
    code: 'Up',
    label: 'Uppträdande',
    color: Colors.amber600, // uppträdande
    icon: 'mic',
    BadgeComponent: MicVocalBadge,
  },
  {
    code: 'Ut',
    label: 'Utflykt',
    color: Colors.lime600, // utflykt
    icon: 'explore',
    BadgeComponent: ExploreBadge,
  },
  {
    code: 'W',
    label: 'Workshop',
    color: Colors.purple600, // workshop
    icon: 'handyman',
    BadgeComponent: WorkshopBadge,
  },
];

// Helper function to get category by code
export const getCategoryByCode = (code: string): EventCategory | undefined => {
  return EVENT_CATEGORIES.find(category => category.code === code);
};

// Helper function to get event category badge
export const getEventCategoryBadge = (categoryCode: string, customColor?: string, size?: number) => {
  const category = getCategoryByCode(categoryCode);
  if (!category) return null;
  
  const { BadgeComponent } = category;
  const color = customColor || category.color;
  
  return <BadgeComponent color={color} size={size} />;
};