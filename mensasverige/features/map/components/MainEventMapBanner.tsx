import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import EventHeader from '../../events/components/EventHeader';
import { useSelectedMainEvent } from '../../events/hooks/useMainEvents';
import { useEventAttendance } from '../../events/hooks/useEventAttendance';
import { isMapLockedForEvent } from '../../events/utils/mainEventUtils';
import { registerLabel } from '../../events/utils/eventAttendance';
import { EVENT_HEADER_BG, PAGE_PADDING, typeScale } from '../../events/styles/typeScale';
import { Colors } from '@/constants/Colors';

/**
 * Top of the map while a main event is selected: the event header, plus an
 * info bar with a register link when the user is not registered. Renders
 * nothing when no event is selected.
 */
const MainEventMapBanner: React.FC = () => {
  const dark = useColorScheme() === 'dark';
  const { selectedMainEvent } = useSelectedMainEvent();
  const { status, siteUrl, busy: registering, register } = useEventAttendance(selectedMainEvent);
  const label = registerLabel(status, siteUrl);

  if (!selectedMainEvent) return null;

  return (
    <View>
      <EventHeader />
      {isMapLockedForEvent(selectedMainEvent) && (
        <View style={[styles.infoBar, { backgroundColor: dark ? Colors.coolGray800 : '#FFFFFF' }]}>
          <Text style={[styles.infoText, { color: dark ? Colors.coolGray200 : '#374151' }]}>
            Deltagare visas för den som är anmäld till evenemanget.
          </Text>
          {!!label && (
            <TouchableOpacity
              onPress={register}
              disabled={registering}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.link, registering && styles.linkDisabled]}>{label}</Text>
            </TouchableOpacity>
          )}
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
    color: EVENT_HEADER_BG,
  },
  linkDisabled: {
    opacity: 0.6,
  },
});

export default MainEventMapBanner;
