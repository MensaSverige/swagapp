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

const styles = StyleSheet.create({
  badge: {
    borderRadius: 15,
    minWidth: 30,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const createBadge = (iconName: keyof typeof MaterialIcons.glyphMap, color: string, size: number = 18) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <MaterialIcons name={iconName} size={size} color="#fff" />
  </View>
);

export const RestaurantBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('restaurant', color, size);

export const ExploreBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('explore', color, size);

export const GameBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('casino', color, size);

export const GlobeBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('groups', color, size);

export const TeenBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('escalator-warning', color, size);

export const PartyBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('celebration', color, size);

export const MicVocalBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('mic', color, size);

export const LectureBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('co-present', color, size);

export const WorkshopBadge: React.FC<EventBadgesProps> = ({ color, size = 18 }) => 
  createBadge('handyman', color, size);



