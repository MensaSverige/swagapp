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
    color: '#6366F1', // föreläsning
    icon: 'co-present',
    BadgeComponent: LectureBadge,
  },
  {
    code: 'Fö',
    label: 'Föreningsarbete',
    color: '#1E3A8A', // föreningsarbete
    icon: 'groups',
    BadgeComponent: GlobeBadge,
  },
  {
    code: 'M',
    label: 'Middag/Festligheter',
    color: '#BE185D', // middag/festligheter
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
    color: '#C026D3', // ungdomsaktivitet
    icon: 'escalator-warning',
    BadgeComponent: TeenBadge,
  },
  {
    code: 'Up',
    label: 'Uppträdande',
    color: '#F59E0B', // uppträdande
    icon: 'mic',
    BadgeComponent: MicVocalBadge,
  },
  {
    code: 'Ut',
    label: 'Utflykt',
    color: '#65A30D', // utflykt
    icon: 'explore',
    BadgeComponent: ExploreBadge,
  },
  {
    code: 'W',
    label: 'Workshop',
    color: '#9333EA', // workshop
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