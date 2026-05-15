import { useMemo } from 'react';
import useStore from '@/features/common/store/store';
import { User } from '../../../api_schema/types';
import { ExtendedEvent } from '../types/eventUtilTypes';

export function useEventUsers(event: ExtendedEvent) {
  const usersById = useStore((s) => s.usersById);

  const adminUsers = useMemo(
    () =>
      (event.admin ?? [])
        .map((id) => usersById[id])
        .filter((u): u is User => Boolean(u)),
    [event.admin, usersById]
  );

  const canSeeAttendees =
    event.showAttendees === 'all' ||
    (event.showAttendees === 'toAttending' && event.attending);

  console.log(
    '[useEventUsers] event', event.id,
    '| showAttendees:', event.showAttendees,
    '| attending:', event.attending,
    '| canSeeAttendees:', canSeeAttendees,
    '| raw attendees:', event.attendees
  );

  const attendeeUsers = useMemo(() => {
    if (!canSeeAttendees) {
      console.log('[useEventUsers] hidden — canSeeAttendees=false for event', event.id);
      return [];
    }
    // The backend already enforces show_profile privacy at the API level (403 for hidden profiles).
    // If a user is in the cache, the backend decided they are visible — no need to re-filter here.
    const mapped = (event.attendees ?? [])
      .map((a) => {
        const user = usersById[a.userId];
        if (!user) console.warn('[useEventUsers] userId', a.userId, 'not in cache (type:', typeof a.userId, ')');
        return user;
      })
      .filter((u): u is User => Boolean(u));
    console.log('[useEventUsers] event', event.id, '| attendeeUsers resolved:', mapped.length, '/', (event.attendees ?? []).length);
    return mapped;
  }, [event.attendees, usersById, canSeeAttendees]);

  return { adminUsers, attendeeUsers, canSeeAttendees };
}
