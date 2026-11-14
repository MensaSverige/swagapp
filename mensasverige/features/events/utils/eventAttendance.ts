import { Event } from '../../../api_schema/types';
import { isUserEffectivelyAttending } from './eventUtils';
import { isEventOver } from './mainEventUtils';

/**
 * Where the viewer stands with an event, for the status row of the event
 * page. The same rules for every kind of event: a riksträff, a local event
 * and an activity. An attendee's `leave` says where leaving happens: in the
 * app, on the booking site (the riksträff, a paid activity), or not at all
 * (the event is over).
 */
export type AttendanceStatus =
  | { kind: 'cancelled' }
  | { kind: 'past' }
  | { kind: 'attending'; leave: 'app' | 'bookingSite' | 'none' }
  | { kind: 'host' }
  | { kind: 'paid' }
  | { kind: 'bookingSite' }
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
 * How many the booking site says are registered: everyone registered to the
 * riksträff, or everyone booked on an activity. Larger than the list the app
 * shows, which holds only who it may name. Null where the site gives none.
 */
export const registeredCount = (event: Pick<Event, 'extras'>): number | null => {
  const { attendeeCount, bookedCount } = event.extras ?? {};
  if (typeof attendeeCount === 'number') return attendeeCount;
  return typeof bookedCount === 'number' ? bookedCount : null;
};

/**
 * The viewer's status. A paid activity is booked and paid on the booking
 * site, never in the app, and so is the riksträff; a main event's price is
 * not known to the app (a local event states it in its invitation), so a
 * main event is never treated as paid.
 */
export const attendanceStatus = (
  event: Event,
  userId: number | undefined,
  now: number,
): AttendanceStatus => {
  if (event.cancelled) return { kind: 'cancelled' };
  const over = isEventOver(event, now);
  const paid = !isMainEventSource(event) && (event.price ?? 0) > 0;
  const onBookingSite = paid || event.source === 'external_root';
  if (event.attending) {
    return { kind: 'attending', leave: over ? 'none' : onBookingSite ? 'bookingSite' : 'app' };
  }
  if (over) return { kind: 'past' };
  if (isUserEffectivelyAttending(event, userId)) return { kind: 'host' };
  if (paid) return { kind: 'paid' };
  if (event.source === 'external_root') return { kind: 'bookingSite' };
  if (event.bookable) return { kind: 'open' };
  const left = placesLeft(event);
  if (left !== null && left <= 0) return { kind: 'full' };
  return { kind: 'closed' };
};

/**
 * The label of the button that registers, or null where none belongs: in the
 * app for an open event, on the booking site for the riksträff.
 */
export const registerLabel = (status: AttendanceStatus | null, siteUrl: string | null): string | null => {
  if (status?.kind === 'open') return 'Anmäl mig!';
  if (status?.kind === 'bookingSite' && siteUrl) return 'Anmäl dig på bokningssidan';
  return null;
};

/**
 * The booking site for an event of the riksträff: the riksträff's own
 * `siteUrl`, for itself and for its activities. Null when none is known.
 */
export const bookingSiteUrl = (
  event: Pick<Event, 'source' | 'parentEvent' | 'extras'>,
  mainEvents: Pick<Event, 'id' | 'source' | 'extras'>[],
): string | null => {
  const root = event.source === 'external_root'
    ? event
    : mainEvents.find(m => m.id === event.parentEvent) ?? mainEvents.find(m => m.source === 'external_root');
  const url = root?.extras?.siteUrl;
  return typeof url === 'string' && url ? url : null;
};

/** "3 platser kvar", "1 plats kvar", "Fullbokat", or null without a limit. */
export const formatPlacesLeft = (left: number | null): string | null => {
  if (left === null) return null;
  if (left <= 0) return 'Fullbokat';
  return left === 1 ? '1 plats kvar' : `${left} platser kvar`;
};
