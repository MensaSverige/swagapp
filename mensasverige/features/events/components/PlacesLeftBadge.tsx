import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlacesLeftBadgeProps {
  placesLeft: number;
  maxAttendees: number;
}

const PlacesLeftBadge: React.FC<PlacesLeftBadgeProps> = ({ placesLeft, maxAttendees }) => {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {placesLeft} av {maxAttendees} {maxAttendees === 1 ? 'plats' : 'platser'} kvar
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#059669', // Green-600
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PlacesLeftBadge;