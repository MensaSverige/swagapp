import React from "react";
import { 
  View,
  StyleSheet
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

export interface EventBadgesProps {
    color: string;
    size?: number;
  }

const createBadge = (iconName: keyof typeof MaterialIcons.glyphMap, color: string, size: number = 18) => {
  const badgeSize = size + 4;
  return (
    <View style={[{
      borderRadius: badgeSize / 2,
      width: badgeSize,
      height: badgeSize,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color
    }]}>
      <MaterialIcons name={iconName} size={size - 4} color="#fff" />
    </View>
  );
};

export const RestaurantBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('restaurant', color, size);

export const ExploreBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('explore', color, size);

export const GameBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('casino', color, size);

export const GlobeBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('groups', color, size);

export const TeenBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('escalator-warning', color, size);

export const PartyBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('celebration', color, size);

export const MicVocalBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('mic', color, size);

export const LectureBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('co-present', color, size);

export const WorkshopBadge: React.FC<EventBadgesProps> = ({ color, size = 14 }) => 
  createBadge('handyman', color, size);
