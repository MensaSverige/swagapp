import { useMemo } from 'react';
import useStore from '@/features/common/store/store';
import { Event, User } from '../../../api_schema/types';

export function useEventUsers(
  event: Pick<Event, 'id' | 'admin' | 'attendees' | 'showAttendees' | 'attending' | 'extras'>,
) {
  const usersById = useStore((s) => s.usersById);

  const adminUsers = useMemo(
    () =>
      (event.admin ?? [])
        .map((id) => usersById[id])
        .filter((u): u is User => Boolean(u)),
    [event.admin, usersById]
  );

  // The backend sends 'all' to everyone who may see them, hosts included.
  const canSeeAttendees =
    event.showAttendees === 'all' ||
    (event.showAttendees === 'toAttending' && !!event.attending);


  const attendeeUsers = useMemo(() => {
    if (!canSeeAttendees) return [];
    // The backend already enforces show_profile privacy at the API level (403 for hidden profiles).
    // If a user is in the cache, the backend decided they are visible — no need to re-filter here.
    // Names line up with attendees. Someone without an app account (or with a
    // profile hidden from the viewer) shows by name and initials, not linked.
    const names = Array.isArray(event.extras?.attendeeNames) ? (event.extras.attendeeNames as string[]) : [];
    const mapped = (event.attendees ?? [])
      .map((a, i) => {
        const user = usersById[a.userId];
        if (user) return user;
        const name = (names[i] ?? '').trim();
        if (!name) return undefined;
        const [firstName, ...rest] = name.split(' ');
        return { userId: 0, firstName, lastName: rest.join(' '), avatar_url: null } as unknown as User;
      })
      .filter((u): u is User => Boolean(u));
    return mapped;
  }, [event.attendees, event.extras, usersById, canSeeAttendees]);

  return { adminUsers, attendeeUsers, canSeeAttendees };
}
