import React from "react";
import { 
  View,
  Text,
  StyleSheet
} from "react-native";

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
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const createBadge = (emoji: string, color: string) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={[styles.badgeText, { color: '#fff' }]}>{emoji}</Text>
  </View>
);

export const DinnerBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('✨', color);

export const FootprintsBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('👣', color);

export const GameBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('🎲', color);

export const GlobeBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('🌍', color);

export const TeenBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('🌱', color);

export const PartyBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('🎉', color);

export const MicVocalBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('🎤', color);

export const LectureBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('📊', color);

export const WorkshopBadge: React.FC<EventBadgesProps> = ({ color, size }) => 
  createBadge('🛠️', color);



