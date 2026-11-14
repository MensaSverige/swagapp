import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Event } from '../../../../api_schema/types';
import UserList from '../UserList';
import { useEventUsers } from '../../hooks/useEventUsers';
import { isLocalEvent } from '../../utils/mainEventUtils';
import { registeredCount } from '../../utils/eventAttendance';
import { themeColors, typeScale } from '../../styles/typeScale';

/**
 * Who hosts the event and who comes, the same on every event page. A host
 * shows as their profile when they have an account the viewer may see, and
 * as a name otherwise. Participants show only to those who may see them;
 * where registering would reveal them, the section says so.
 */
const EventPeople: React.FC<{ event: Event }> = ({ event }) => {
  const dark = useColorScheme() === 'dark';
  const { adminUsers, attendeeUsers, canSeeAttendees } = useEventUsers(event);

  const adminCount = event.admin?.length ?? 0;
  // A local event's organiser without a membership number has a name but no admin id.
  const showHosts = adminCount > 0 || (isLocalEvent(event) && (event.hosts?.length ?? 0) > 0);
  const hiddenUntilRegistered = !canSeeAttendees && event.showAttendees === 'toAttending';
  const showAttendees = canSeeAttendees && attendeeUsers.length > 0;
  const attendeeCount = registeredCount(event) ?? undefined;
  // Booked, but none of them known to the app: the total alone.
  const countOnly = canSeeAttendees && !showAttendees && (attendeeCount ?? 0) > 0;

  return (
    <View>
      {showHosts && (
        <View style={styles.section}>
          <UserList
            users={adminUsers}
            title={adminCount > 1 ? 'Värdar' : 'Värd'}
            fallbackData={event.hosts}
            alwaysExpanded
            gridAvatarSize="md"
          />
        </View>
      )}
      {showAttendees && (
        <View style={styles.section}>
          <UserList users={attendeeUsers} title="Deltagare" count={attendeeCount} />
        </View>
      )}
      {countOnly && (
        <View style={styles.hidden}>
          <ThemedText style={styles.h2}>
            Deltagare <ThemedText style={[styles.h2, styles.count, { color: themeColors(dark).meta }]}>{attendeeCount}</ThemedText>
          </ThemedText>
        </View>
      )}
      {hiddenUntilRegistered && (
        <View style={styles.hidden}>
          <ThemedText style={styles.h2}>Deltagare</ThemedText>
          <ThemedText style={[styles.meta, { color: themeColors(dark).meta }]}>
            Visas när du är anmäld.
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  hidden: { marginTop: 24, gap: 4 },
  h2: { ...typeScale.h2 },
  count: { fontWeight: '400' },
  meta: { ...typeScale.meta },
});

export default EventPeople;
