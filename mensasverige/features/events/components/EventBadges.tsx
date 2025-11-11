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

const createBadge = (iconName: keyof typeof MaterialIcons.glyphMap, color: string, size: number = 32) => {
  return (
    <View style={[{
      borderRadius: size / 2,
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color + '20'
    }]}>
      <MaterialIcons name={iconName} size={16} color={color} />
    </View>
  );
};

export const RestaurantBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('restaurant', color, size);

export const ExploreBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('explore', color, size);

export const GameBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('casino', color, size);

export const GlobeBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('groups', color, size);

export const TeenBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('escalator-warning', color, size);

export const PartyBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('celebration', color, size);

export const MicVocalBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('mic', color, size);

export const LectureBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('co-present', color, size);

export const WorkshopBadge: React.FC<EventBadgesProps> = ({ color, size = 32 }) => 
  createBadge('handyman', color, size);
