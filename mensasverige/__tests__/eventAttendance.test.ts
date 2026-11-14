/**
 * Unit tests for the event page's status rules, shared by main events and
 * activities.
 */
import { Event } from '../api_schema/types';
import { attendanceStatus, bookingSiteUrl, formatPlacesLeft, placesLeft } from '../features/events/utils/eventAttendance';

const NOW = new Date('2026-11-14T12:00:00Z').getTime();

const ev = (overrides: Partial<Event> = {}): Event =>
  ({
    id: 'usr1',
    source: 'user',
    name: 'Brädspel',
    start: '2026-11-20T18:00:00Z',
    end: '2026-11-20T21:00:00Z',
    attending: false,
    bookable: true,
    price: 0,
    admin: [],
    hosts: [],
    attendees: [],
    ...overrides,
  }) as Event;

describe('attendanceStatus', () => {
  it('lets an attendee leave a future, free event', () => {
    expect(attendanceStatus(ev({ attending: true }), 7, NOW)).toEqual({ kind: 'attending', leave: 'app' });
  });

  it('leaves the riksträff registration to the booking site', () => {
    expect(attendanceStatus(ev({ source: 'external_root', attending: true }), 7, NOW))
      .toEqual({ kind: 'attending', leave: 'bookingSite' });
    expect(attendanceStatus(ev({ source: 'calendar', attending: true }), 7, NOW))
      .toEqual({ kind: 'attending', leave: 'app' });
  });

  it('sends registration to the riksträff to the booking site', () => {
    expect(attendanceStatus(ev({ source: 'external_root', bookable: true }), 7, NOW).kind).toBe('bookingSite');
  });

  it('keeps an attendee of a paid activity from leaving in the app', () => {
    expect(attendanceStatus(ev({ attending: true, price: 300 }), 7, NOW)).toEqual({ kind: 'attending', leave: 'bookingSite' });
  });

  it('sends a paid activity to the booking site, but never a main event', () => {
    expect(attendanceStatus(ev({ price: 300 }), 7, NOW).kind).toBe('paid');
    expect(attendanceStatus(ev({ source: 'calendar', price: 400 }), 7, NOW).kind).toBe('open');
  });

  it('recognises the host', () => {
    expect(attendanceStatus(ev({ admin: [7] }), 7, NOW).kind).toBe('host');
    expect(attendanceStatus(ev({ hosts: [{ userId: 7, fullName: 'X' }] } as Partial<Event>), 7, NOW).kind).toBe('host');
  });

  it('tells full from closed, and past and cancelled apart', () => {
    expect(attendanceStatus(ev({ bookable: false, maxAttendees: 2, attendees: [{ userId: 1 }, { userId: 2 }] }), 7, NOW).kind).toBe('full');
    expect(attendanceStatus(ev({ bookable: false }), 7, NOW).kind).toBe('closed');
    expect(attendanceStatus(ev({ start: '2026-11-01T18:00:00Z', end: '2026-11-01T20:00:00Z' }), 7, NOW).kind).toBe('past');
    expect(attendanceStatus(ev({ cancelled: '2026-11-10T00:00:00Z' }), 7, NOW).kind).toBe('cancelled');
  });
});

describe('places', () => {
  it('counts from bookedCount before attendees', () => {
    expect(placesLeft(ev({ maxAttendees: 10, extras: { bookedCount: 7 }, attendees: [] }))).toBe(3);
    expect(placesLeft(ev({ maxAttendees: 10, attendees: [{ userId: 1 }] }))).toBe(9);
    expect(placesLeft(ev({ maxAttendees: null }))).toBeNull();
  });

  it('words what is left', () => {
    expect(formatPlacesLeft(3)).toBe('3 platser kvar');
    expect(formatPlacesLeft(1)).toBe('1 plats kvar');
    expect(formatPlacesLeft(0)).toBe('Fullbokat');
    expect(formatPlacesLeft(null)).toBeNull();
  });
});

describe('bookingSiteUrl', () => {
  const root = ev({ id: 'root1', source: 'external_root', extras: { siteUrl: 'https://swag.example' } });
  it("is the riksträff's own site, for it and its activities", () => {
    expect(bookingSiteUrl(root, [root])).toBe('https://swag.example');
    expect(bookingSiteUrl(ev({ source: 'external', parentEvent: 'root1' }), [root])).toBe('https://swag.example');
  });
  it('is null when no riksträff names one', () => {
    expect(bookingSiteUrl(ev({ source: 'calendar' }), [])).toBeNull();
  });
});
