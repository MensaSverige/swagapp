import { Event } from '../../../api_schema/types';

/**
 * Where the viewer stands with an event, for the status row of the event
 * page. The same rules for every kind of event: a riksträff, a local event
 * and an activity.
 */
export type AttendanceStatus =
  | { kind: 'cancelled' }
  | { kind: 'past' }
  | { kind: 'attending'; canLeave: boolean }
  | { kind: 'host' }
  | { kind: 'paid' }
  | { kind: 'open' }
  | { kind: 'full' }
  | { kind: 'closed' };

/** Main events are registered for through their own endpoints and list. */
export const isMainEventSource = (event: Pick<Event, 'source'>): boolean =>
  event.source === 'calendar' || event.source === 'external_root';

/** Places left, or null when the event has no limit or the count is unknown. */
export const placesLeft = (
  event: Pick<Event, 'maxAttendees' | 'attendees' | 'extras'>,
): number | null => {
  if (!event.maxAttendees) return null;
  const booked = typeof event.extras?.bookedCount === 'number'
    ? event.extras.bookedCount
    : event.attendees?.length;
  return booked === undefined ? null : event.maxAttendees - booked;
};

/**
 * The viewer's status. A paid activity is booked and paid on the booking
 * site, never in the app; a main event's price is not known to the app (a
 * local event states it in its invitation), so it is never treated as paid.
 */
export const attendanceStatus = (
  event: Event,
  userId: number | undefined,
  now: number,
): AttendanceStatus => {
  if (event.cancelled) return { kind: 'cancelled' };
  const endIso = event.end ?? event.start;
  const over = !!endIso && new Date(endIso).getTime() < now;
  const paid = !isMainEventSource(event) && (event.price ?? 0) > 0;
  if (event.attending) return { kind: 'attending', canLeave: !over && !paid };
  if (over) return { kind: 'past' };
  const hosts = userId !== undefined && (
    (event.admin ?? []).includes(userId) || (event.hosts ?? []).some(h => h.userId === userId)
  );
  if (hosts) return { kind: 'host' };
  if (paid) return { kind: 'paid' };
  if (event.bookable) return { kind: 'open' };
  const left = placesLeft(event);
  if (left !== null && left <= 0) return { kind: 'full' };
  return { kind: 'closed' };
};

/** "3 platser kvar", "1 plats kvar", "Fullbokat", or null without a limit. */
export const formatPlacesLeft = (left: number | null): string | null => {
  if (left === null) return null;
  if (left <= 0) return 'Fullbokat';
  return left === 1 ? '1 plats kvar' : `${left} platser kvar`;
};
