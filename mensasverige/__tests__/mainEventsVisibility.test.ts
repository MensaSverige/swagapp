import {
  filterVisibleEvents,
  getMainEventMapCenter,
  getMainEventName,
  isMapLockedForEvent,
  resolveParentEventForNewEvent,
} from '../features/events/utils/mainEventUtils';
import { Event } from '../api_schema/types';

const ev = (overrides: Partial<Event>): Event =>
  ({ id: 'x', source: 'user', name: 'x', start: '2026-11-20T16:00:00', end: '2026-11-22T12:00:00', ...overrides }) as Event;

describe('filterVisibleEvents', () => {
  const mains = [
    ev({ id: 'root1', attending: false }),
    ev({ id: 'cal1', attending: true }),
  ];
  const events = [
    ev({ id: 'a', parentEvent: 'root1' }),
    ev({ id: 'b', parentEvent: 'cal1' }),
    ev({ id: 'c', parentEvent: null }),
    ev({ id: 'd', parentEvent: 'unknown' }),
    ev({ id: 'e' }),
  ];

  it('hides children of a main event the user is not registered to', () => {
    expect(filterVisibleEvents(events, mains).map(e => e.id)).toEqual(['b', 'c', 'd', 'e']);
  });

  it('keeps everything when there are no main events', () => {
    expect(filterVisibleEvents(events, [])).toHaveLength(5);
  });
});

describe('resolveParentEventForNewEvent', () => {
  it('uses the selected main event when registered', () => {
    expect(resolveParentEventForNewEvent(ev({ id: 'root1', attending: true }))).toBe('root1');
  });
  it('is null when not registered or nothing selected', () => {
    expect(resolveParentEventForNewEvent(ev({ id: 'root1', attending: false }))).toBeNull();
    expect(resolveParentEventForNewEvent(null)).toBeNull();
  });
});

describe('map helpers', () => {
  it('locks the map only for a selected, unregistered event', () => {
    expect(isMapLockedForEvent(null)).toBe(false);
    expect(isMapLockedForEvent(ev({ attending: true }))).toBe(false);
    expect(isMapLockedForEvent(ev({ attending: false }))).toBe(true);
  });

  it('centres on the event only while ongoing and with coordinates', () => {
    const e = ev({ latitude: 57.7, longitude: 14.2 });
    const during = new Date('2026-11-21T10:00:00').getTime();
    const before = new Date('2026-11-01T10:00:00').getTime();
    expect(getMainEventMapCenter(e, during)).toEqual({ latitude: 57.7, longitude: 14.2 });
    expect(getMainEventMapCenter(e, before)).toBeNull();
    expect(getMainEventMapCenter(ev({}), during)).toBeNull();
    expect(getMainEventMapCenter(null, during)).toBeNull();
  });
});

describe('getMainEventName', () => {
  const mains = [ev({ id: 'root1', name: 'Riksträff' })];
  it('resolves the name of a known main event', () => {
    expect(getMainEventName(mains, 'root1')).toBe('Riksträff');
  });
  it('returns null for an unknown id', () => {
    expect(getMainEventName(mains, 'nope')).toBeNull();
  });
});
