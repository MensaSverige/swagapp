import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Event } from '../../../../api_schema/types';
import UserList from '../UserList';
import { useEventUsers } from '../../hooks/useEventUsers';
import { isLocalEvent } from '../../utils/mainEventUtils';
import { typeScale } from '../../styles/typeScale';

/**
 * Who hosts the event and who comes, the same on every event page. A host
 * shows as their profile when they have an account the viewer may see, and
 * as a name otherwise. Participants show only to those who may see them;
 * where registering would reveal them, the section says so.
 */
const EventPeople: React.FC<{
  event: Event;
  /** Leave out "visas när du är anmäld" where the page already says so, as the riksträff's locked box does. */
  omitHiddenNote?: boolean;
}> = ({ event, omitHiddenNote = false }) => {
  const dark = useColorScheme() === 'dark';
  const { adminUsers, attendeeUsers, canSeeAttendees } = useEventUsers(event);

  const adminCount = event.admin?.length ?? 0;
  // A local event's organiser without a membership number has a name but no admin id.
  const showHosts = adminCount > 0 || (isLocalEvent(event) && (event.hosts?.length ?? 0) > 0);
  const hiddenUntilRegistered = !omitHiddenNote && !canSeeAttendees && event.showAttendees === 'toAttending';
  const showAttendees = canSeeAttendees && attendeeUsers.length > 0;

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
          <UserList users={attendeeUsers} title="Deltagare" />
        </View>
      )}
      {hiddenUntilRegistered && (
        <View style={styles.hidden}>
          <ThemedText style={styles.h2}>Deltagare</ThemedText>
          <ThemedText style={[styles.meta, { color: dark ? Colors.coolGray400 : '#4B5563' }]}>
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
  meta: { ...typeScale.meta },
});

export default EventPeople;
