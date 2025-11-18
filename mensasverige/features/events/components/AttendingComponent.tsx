import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme
} from 'react-native';
import * as Linking from 'expo-linking';
import { useEvents } from '../hooks/useEvents';
import { createEventCardStyles } from '../styles/eventCardStyles';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { ThemedText } from '@/components/ThemedText';
import useStore from '@/features/common/store/store';


interface AttendingComponentProps {
  event: ExtendedEvent;
  onAttendanceChange?: () => void;
}

const AttendingComponent: React.FC<AttendingComponentProps> = ({
  event,
  onAttendanceChange
}) => {
  const [changingAttendance, setChangingAttendance] = useState<boolean>(false);
  const { eventInfo } = useStore();
  const { attendEventById, unattendEventById } = useEvents();
  const colorScheme = useColorScheme();
  const eventCardStyles = createEventCardStyles(colorScheme ?? 'light');

  const handlePressAttend = async () => {
    if (!event.id) return;

    setChangingAttendance(true);
    try {
      await attendEventById(event.id);
      onAttendanceChange?.(); // Notify parent of attendance change
    } catch (error) {
      console.error('Could not attend event', error);
      Alert.alert('Error', 'Could not attend event. Please try again.');
    } finally {
      setChangingAttendance(false);
    }
  };

  const handlePressUnattend = async () => {
    if (!event.id) return;

    setChangingAttendance(true);
    try {
      await unattendEventById(event.id);
      onAttendanceChange?.(); // Notify parent of attendance change
    } catch (error) {
      console.error('Could not unattend event', error);
      Alert.alert('Error', 'Could not unattend event. Please try again.');
    } finally {
      setChangingAttendance(false);
    }
  };

  if (changingAttendance) {
    return (
      <View style={eventCardStyles.attendingButtonContainer}>
        <ActivityIndicator size="small" color="#0F766E" />
      </View>
    );
  }

  if (!event.isFutureEvent) {
    return null;
  }

  if (event.price && event.price > 0) {
    const siteUrl = eventInfo?.siteUrl;
    return (
      <ThemedText type="defaultSemiBold">
        Detta är ett betalt evenemang. Anmälan och betalning sker via{' '}
        {siteUrl ? (
          <ThemedText
            type='link'
            onPress={() => Linking.openURL(siteUrl)}
          >
            bokningssidan
          </ThemedText>
        ) : (
          'bokningssidan'
        )}.
      </ThemedText>
    )
  }

  if (event.attending) {
    return (
      <View style={eventCardStyles.attendingButtonContainer}>
        <TouchableOpacity onPress={handlePressUnattend} style={eventCardStyles.unattendButton}>
          <Text style={eventCardStyles.buttonText}>Ta bort anmälan</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    if (event.bookable && !event.attendingOrHost) {
      return (
        <View style={eventCardStyles.attendingButtonContainer}>
          <TouchableOpacity onPress={handlePressAttend} style={eventCardStyles.attendingButton}>
            <Text style={eventCardStyles.buttonText}>Anmäl mig!</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }
};

export default AttendingComponent;