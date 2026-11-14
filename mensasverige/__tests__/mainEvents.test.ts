/**
 * Unit tests for main-event logic: auto-select, start-page grouping, date
 * formatting and the focus-mode state in EventsSlice.
 */
import { createStore } from 'zustand';
import { createEventsSlice } from '../features/events/store/EventsSlice';
import {
  AUTO_SELECT_AFTER_MS,
  AUTO_SELECT_BEFORE_MS,
  findAutoSelectMainEventId,
  formatMainEventDateRange,
  formatRelativeStart,
  formatRowDateColumn,
  getMainEventChildren,
  groupMainEvents,
  isMainEventOngoing,
  selectToBook,
  splitAddress,
} from '../features/events/utils/mainEventUtils';
import { Event } from '../api_schema/types';
import { ExtendedEvent } from '../features/events/types/eventUtilTypes';

const DAY = 24 * 60 * 60 * 1000;

const main = (overrides: Partial<Event> = {}): Event =>
  ({
    id: 'root2026-11-20',
    source: 'external_root',
    name: 'Riksträff',
    start: '2026-11-20T16:00:00',
    end: '2026-11-22T12:00:00',
    attending: true,
    bookable: false,
    ...overrides,
  }) as Event;

const at = (iso: string) => new Date(iso).getTime();

describe('findAutoSelectMainEventId', () => {
  const ev = main();
  const start = at(ev.start);
  const end = at(ev.end as string);

  it('selects inside the window and on both boundaries (inclusive)', () => {
    expect(findAutoSelectMainEventId([ev], start - AUTO_SELECT_BEFORE_MS, false)).toBe(ev.id);
    expect(findAutoSelectMainEventId([ev], start + DAY, false)).toBe(ev.id);
    expect(findAutoSelectMainEventId([ev], end + AUTO_SELECT_AFTER_MS, false)).toBe(ev.id);
  });

  it('does not select just outside the window', () => {
    expect(findAutoSelectMainEventId([ev], start - AUTO_SELECT_BEFORE_MS - 1, false)).toBeNull();
    expect(findAutoSelectMainEventId([ev], end + AUTO_SELECT_AFTER_MS + 1, false)).toBeNull();
  });

  it('ignores events the user is not registered to', () => {
    expect(findAutoSelectMainEventId([main({ attending: false })], start, false)).toBeNull();
  });

  it('uses start when end is missing', () => {
    const noEnd = main({ end: null });
    expect(findAutoSelectMainEventId([noEnd], start + AUTO_SELECT_AFTER_MS, false)).toBe(noEnd.id);
    expect(findAutoSelectMainEventId([noEnd], start + AUTO_SELECT_AFTER_MS + 1, false)).toBeNull();
  });

  it('picks the earliest start when several qualify', () => {
    const later = main({ id: 'cal2', start: '2026-11-21T10:00:00', end: '2026-11-21T12:00:00' });
    const earlier = main({ id: 'cal1', start: '2026-11-19T10:00:00', end: '2026-11-23T12:00:00' });
    expect(findAutoSelectMainEventId([later, ev, earlier], at('2026-11-21T11:00:00'), false)).toBe('cal1');
  });

  it('returns null once dismissed, even when an event qualifies', () => {
    expect(findAutoSelectMainEventId([ev], start + DAY, true)).toBeNull();
  });
});

describe('focus mode state', () => {
  const build = () => createStore<ReturnType<typeof createEventsSlice>>(createEventsSlice as any);

  it('starts with nothing selected and auto-select not dismissed', () => {
    const s = build().getState();
    expect(s.selectedMainEventId).toBeNull();
    expect(s.autoSelectDismissed).toBe(false);
  });

  it('auto-select and manual select keep the dismissed flag untouched', () => {
    const store = build();
    store.getState().autoSelectMainEvent('a');
    expect(store.getState().selectedMainEventId).toBe('a');
    store.getState().selectMainEvent('b');
    expect(store.getState().selectedMainEventId).toBe('b');
    expect(store.getState().autoSelectDismissed).toBe(false);
  });

  it('leaving clears the selection and keeps auto-select dismissed', () => {
    const store = build();
    store.getState().selectMainEvent('a');
    store.getState().leaveMainEvent();
    const s = store.getState();
    expect(s.selectedMainEventId).toBeNull();
    expect(s.autoSelectDismissed).toBe(true);
    // Rule used by the loader: dismissed means no auto-select again.
    expect(findAutoSelectMainEventId([main()], at('2026-11-21T12:00:00'), s.autoSelectDismissed)).toBeNull();
  });
});

describe('groupMainEvents', () => {
  const now = at('2026-11-21T12:00:00');

  it('splits into ongoing, riksträffar and local, each sorted by start', () => {
    const ongoing = main({ id: 'root-now' });
    const rootLate = main({ id: 'root-late', start: '2027-05-13T10:00:00', end: '2027-05-16T12:00:00' });
    const rootSoon = main({ id: 'root-soon', start: '2026-12-05T10:00:00', end: '2026-12-06T12:00:00' });
    const localB = main({ id: 'cal-b', source: 'calendar', start: '2026-12-10T18:00:00', end: '2026-12-10T20:00:00' });
    const localA = main({ id: 'cal-a', source: 'calendar', start: '2026-11-25T18:00:00', end: '2026-11-25T20:00:00' });
    const g = groupMainEvents([rootLate, localB, ongoing, rootSoon, localA], now);
    expect(g.ongoing.map(e => e.id)).toEqual(['root-now']);
    expect(g.rootEvents.map(e => e.id)).toEqual(['root-soon', 'root-late']);
    expect(g.local.map(e => e.id)).toEqual(['cal-a', 'cal-b']);
  });

  it('puts an ongoing local event in "Pågår nu" only', () => {
    const live = main({ id: 'cal-live', source: 'calendar', start: '2026-11-21T10:00:00', end: '2026-11-21T14:00:00' });
    const g = groupMainEvents([live], now);
    expect(g.ongoing).toHaveLength(1);
    expect(g.local).toHaveLength(0);
  });

  it('leaves groups empty when nothing matches', () => {
    expect(groupMainEvents([], now)).toEqual({ ongoing: [], rootEvents: [], local: [] });
  });

  it('isMainEventOngoing is inclusive on both ends', () => {
    const e = main();
    expect(isMainEventOngoing(e, at(e.start))).toBe(true);
    expect(isMainEventOngoing(e, at(e.end as string))).toBe(true);
    expect(isMainEventOngoing(e, at(e.start) - 1)).toBe(false);
  });
});

describe('date formatting', () => {
  it('formats the row date column for multi-day and one-day events', () => {
    expect(formatRowDateColumn(main())).toEqual({ start: '20 nov', end: '22 nov' });
    const oneDay = main({ start: '2026-11-21T18:30:00', end: '2026-11-21T21:00:00' });
    expect(formatRowDateColumn(oneDay)).toEqual({ start: '18:30', end: '' });
  });

  it('formats multi-day ranges within and across months', () => {
    expect(formatMainEventDateRange(main())).toBe('Fredag 20 – söndag 22 november');
    const across = main({ start: '2026-10-30T10:00:00', end: '2026-11-01T12:00:00' });
    expect(formatMainEventDateRange(across)).toBe('Fredag 30 oktober – söndag 1 november');
  });

  it('formats a one-day event with its time range', () => {
    const oneDay = main({ start: '2026-11-21T10:00:00', end: '2026-11-21T16:00:00' });
    expect(formatMainEventDateRange(oneDay)).toBe('Lördag 21 november, 10:00–16:00');
  });
});

describe('children selection', () => {
  const now = at('2026-11-21T12:00:00');
  const child = (overrides: Partial<ExtendedEvent>): ExtendedEvent =>
    ({
      id: 'c',
      name: 'Aktivitet',
      parentEvent: 'root2026-11-20',
      start: '2026-11-21T15:00:00',
      end: '2026-11-21T16:00:00',
      attending: false,
      attendingOrHost: false,
      bookable: true,
      ...overrides,
    }) as ExtendedEvent;

  it('scopes children to the main event', () => {
    const list = [child({ id: 'a' }), child({ id: 'b', parentEvent: 'other' }), child({ id: 'c', parentEvent: null })];
    expect(getMainEventChildren(list, 'root2026-11-20').map(e => e.id)).toEqual(['a']);
  });

  it('selectToBook keeps upcoming bookable non-attending events, sorted and capped at 5', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      child({ id: `e${i}`, start: `2026-11-22T${String(20 - i).padStart(2, '0')}:00:00` }),
    );
    const excluded = [
      child({ id: 'past', start: '2026-11-21T08:00:00' }),
      child({ id: 'attending', attendingOrHost: true, attending: true }),
      child({ id: 'full', bookable: false }),
    ];
    const res = selectToBook([...excluded, ...many], now);
    expect(res).toHaveLength(5);
    expect(res.map(e => e.id)).toEqual(['e6', 'e5', 'e4', 'e3', 'e2']);
  });
});

describe('formatRelativeStart', () => {
  const ev = (start: string, end: string | null = null) => main({ start, end });

  it('says "Pågår nu" while ongoing', () => {
    const e = ev('2026-11-20T16:00:00', '2026-11-22T12:00:00');
    expect(formatRelativeStart(e, at('2026-11-21T09:00:00'))).toBe('Pågår nu');
    expect(formatRelativeStart(e, at('2026-11-20T16:00:00'))).toBe('Pågår nu');
  });

  it('counts local calendar days: today, tomorrow, N days', () => {
    const e = ev('2026-11-20T16:00:00', '2026-11-22T12:00:00');
    expect(formatRelativeStart(e, at('2026-11-20T08:00:00'))).toBe('I dag');
    expect(formatRelativeStart(e, at('2026-11-19T23:59:00'))).toBe('I morgon');
    expect(formatRelativeStart(e, at('2026-11-18T10:00:00'))).toBe('Om 2 dagar');
  });

  it('counts across a month boundary', () => {
    const e = ev('2026-12-03T10:00:00', '2026-12-04T10:00:00');
    expect(formatRelativeStart(e, at('2026-11-28T20:00:00'))).toBe('Om 5 dagar');
  });

  it('returns empty for past events', () => {
    const e = ev('2026-11-01T10:00:00', '2026-11-02T10:00:00');
    expect(formatRelativeStart(e, at('2026-11-10T10:00:00'))).toBe('');
  });
});

describe('splitAddress', () => {
  it('splits at the first comma', () => {
    expect(splitAddress('Storgatan 1, 111 22 Stockholm', 'Stockholm')).toEqual({
      line1: 'Storgatan 1',
      line2: '111 22 Stockholm',
    });
    expect(splitAddress('Storgatan 1, 111 22 Stockholm, Sverige')?.line2).toBe('111 22 Stockholm, Sverige');
  });

  it('uses locationDescription as line 2 when there is no comma and it differs', () => {
    expect(splitAddress('Storgatan 1', 'Uppsala')).toEqual({ line1: 'Storgatan 1', line2: 'Uppsala' });
    expect(splitAddress('Uppsala', 'Uppsala')).toEqual({ line1: 'Uppsala', line2: '' });
    expect(splitAddress('Storgatan 1', null)).toEqual({ line1: 'Storgatan 1', line2: '' });
  });

  it('handles a missing address', () => {
    expect(splitAddress(null, 'Uppsala')).toEqual({ line1: 'Uppsala', line2: '' });
    expect(splitAddress('  ', '')).toBeNull();
    expect(splitAddress(undefined, undefined)).toBeNull();
  });
});
