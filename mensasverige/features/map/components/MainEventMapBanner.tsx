import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, useColorScheme } from 'react-native';
import EventHeader from '../../events/components/EventHeader';
import { setMainEventAttendance, useSelectedMainEvent } from '../../events/hooks/useMainEvents';
import { isMapLockedForEvent } from '../../events/utils/mainEventUtils';
import { bookingSiteUrl } from '../../events/utils/eventAttendance';
import useStore from '../../common/store/store';
import { PAGE_PADDING, typeScale } from '../../events/styles/typeScale';
import { Colors } from '@/constants/Colors';

/**
 * Top of the map while a main event is selected: the event header, plus an
 * info bar with a register link when the user is not registered. Renders
 * nothing when no event is selected.
 */
const MainEventMapBanner: React.FC = () => {
  const dark = useColorScheme() === 'dark';
  const { selectedMainEvent, selectedMainEventId } = useSelectedMainEvent();
  const mainEvents = useStore(s => s.mainEvents);
  const [registering, setRegistering] = useState(false);

  if (!selectedMainEvent || !selectedMainEventId) return null;

  // The riksträff is registered for on the booking site, not in the app.
  const siteUrl = selectedMainEvent?.source === 'external_root' ? bookingSiteUrl(selectedMainEvent, mainEvents) : null;

  const handleRegister = async () => {
    if (siteUrl) {
      Linking.openURL(siteUrl);
      return;
    }
    if (registering) return;
    setRegistering(true);
    try {
      await setMainEventAttendance(selectedMainEventId, true);
    } catch {
      Alert.alert('Något gick fel', 'Det gick inte att anmäla dig. Försök igen.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <View>
      <EventHeader />
      {isMapLockedForEvent(selectedMainEvent) && (
        <View style={[styles.infoBar, { backgroundColor: dark ? Colors.coolGray800 : '#FFFFFF' }]}>
          <Text style={[styles.infoText, { color: dark ? Colors.coolGray200 : '#374151' }]}>
            Deltagare visas för den som är anmäld till evenemanget.
          </Text>
          <TouchableOpacity
            onPress={handleRegister}
            disabled={registering}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.link, registering && styles.linkDisabled]}>{siteUrl ? 'Anmäl dig på bokningssidan' : 'Anmäl mig'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoBar: {
    paddingHorizontal: PAGE_PADDING,
    paddingVertical: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    ...typeScale.link,
    color: '#005DB4',
  },
  linkDisabled: {
    opacity: 0.6,
  },
});

export default MainEventMapBanner;
