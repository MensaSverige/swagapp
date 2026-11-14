import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { BUTTON_HEIGHT, EVENT_HEADER_BG, typeScale } from '../../styles/typeScale';

/** The one way to register on an event page, under the info rows. */
const EventRegisterButton: React.FC<{ onPress: () => void; busy?: boolean }> = ({ onPress, busy = false }) => (
  <TouchableOpacity
    style={[styles.button, busy && styles.disabled]}
    onPress={onPress}
    disabled={busy}
    activeOpacity={0.8}
    accessibilityRole="button"
  >
    <ThemedText style={styles.text}>{busy ? 'Anmäler...' : 'Anmäl mig!'}</ThemedText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: 10,
    backgroundColor: EVENT_HEADER_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  text: { ...typeScale.button, color: '#FFFFFF' },
});

export default EventRegisterButton;
