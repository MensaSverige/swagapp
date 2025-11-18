import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AttendeeCountBadgeProps {
  attendeeCount: number;
}

const AttendeeCountBadge: React.FC<AttendeeCountBadgeProps> = ({ attendeeCount }) => {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {attendeeCount} {attendeeCount === 1 ? 'deltagare' : 'deltagare'}
      </Text>
      <MaterialIcons name="people" size={14} color={Colors.teal600} />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderColor: Colors.teal600,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    height: 24,
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.teal600,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AttendeeCountBadge;