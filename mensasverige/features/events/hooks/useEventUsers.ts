import { useMemo } from 'react';
import useStore from '@/features/common/store/store';
import { Event, User } from '../../../api_schema/types';

export function useEventUsers(
  event: Pick<Event, 'id' | 'admin' | 'attendees' | 'showAttendees' | 'attending' | 'extras'>,
) {
  const usersById = useStore((s) => s.usersById);
  const currentUserId = useStore((s) => s.user?.userId);

  const adminUsers = useMemo(
    () =>
      (event.admin ?? [])
        .map((id) => usersById[id])
        .filter((u): u is User => Boolean(u)),
    [event.admin, usersById]
  );

  // Hosts see who comes, as the backend lets admins.
  const isHost = currentUserId !== undefined && (event.admin ?? []).includes(currentUserId);
  const canSeeAttendees =
    event.showAttendees === 'all' ||
    (event.showAttendees === 'toAttending' && (!!event.attending || isHost));

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
    console.log('[useEventUsers] event', event.id, '| attendeeUsers resolved:', mapped.length, '/', (event.attendees ?? []).length);
    return mapped;
  }, [event.attendees, event.extras, usersById, canSeeAttendees]);

  return { adminUsers, attendeeUsers, canSeeAttendees };
}
