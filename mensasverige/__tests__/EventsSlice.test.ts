/**
 * Unit tests for EventsSlice (raw state) and the pure derivation functions
 * that useEvents consumes via useMemo.
 */
import { createEventsSlice, defaultEventFilter } from '../features/events/store/EventsSlice';
import {
  filterByOptions,
  calcCategoryCounts,
  getTopCategories,
  groupEventsByDate,
  selectDashboardEvents,
  selectLastMinuteEvents,
} from '../features/events/utils/eventUtils';
import { ExtendedEvent } from '../features/events/types/eventUtilTypes';
import { createStore } from 'zustand';

// Minimal ExtendedEvent factory
const makeEvent = (overrides: Partial<ExtendedEvent> = {}): ExtendedEvent => {
  const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    id: 'evt-' + Math.random().toString(36).slice(2),
    name: 'Test Event',
    start,
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    attending: false,
    attendingOrHost: false,
    isFutureEvent: true,
    bookable: false,
    official: false,
    tags: [],
    admin: [],
    attendees: [],
    hosts: [],
    ...overrides,
  } as unknown as ExtendedEvent;
};

const buildStore = () =>
  createStore<ReturnType<typeof createEventsSlice>>(createEventsSlice as any);

// ── EventsSlice raw store ────────────────────────────────────────────────────

describe('EventsSlice (raw state)', () => {
  test('setEvents stores events', () => {
    const store = buildStore();
    const events = [makeEvent(), makeEvent()];
    store.getState().setEvents(events);
    expect(store.getState().events).toHaveLength(2);
    expect(store.getState().events).toStrictEqual(events);
  });

  test('addOrUpdateEvent splices existing event without replacing entire array', () => {
    const store = buildStore();
    const a = makeEvent({ name: 'A' });
    const b = makeEvent({ name: 'B' });
    store.getState().setEvents([a, b]);
    const updated = { ...a, name: 'A updated' };
    store.getState().addOrUpdateEvent(updated as ExtendedEvent);
    const events = store.getState().events;
    expect(events).toHaveLength(2);
    expect(events.find(e => e.id === a.id)?.name).toBe('A updated');
  });

  test('addOrUpdateEvent appends new event', () => {
    const store = buildStore();
    const a = makeEvent();
    store.getState().setEvents([a]);
    const newEvent = makeEvent();
    store.getState().addOrUpdateEvent(newEvent);
    expect(store.getState().events).toHaveLength(2);
  });

  test('setCurrentEventFilter updates filter state', () => {
    const store = buildStore();
    store.getState().setCurrentEventFilter({ bookable: true });
    expect(store.getState().currentEventFilter.bookable).toBe(true);
  });

  test('resetFilters restores default filter', () => {
    const store = buildStore();
    store.getState().setCurrentEventFilter({ bookable: true });
    store.getState().resetFilters();
    expect(store.getState().currentEventFilter).toStrictEqual(defaultEventFilter);
  });
});

// ── Pure derivation functions ────────────────────────────────────────────────

describe('filterByOptions', () => {
  test('filters by attendingOrHost', () => {
    const attending = makeEvent({ attendingOrHost: true });
    const notAttending = makeEvent({ attendingOrHost: false });
    const result = filterByOptions([attending, notAttending], { attendingOrHost: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(attending.id);
  });

  test('filters by bookable', () => {
    const bookable = makeEvent({ bookable: true });
    const notBookable = makeEvent({ bookable: false });
    const result = filterByOptions([bookable, notBookable], { bookable: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(bookable.id);
  });

  test('filters by tag category', () => {
    const tagged = makeEvent({ tags: [{ code: 'sport', text: 'Sport', colorBackground: '#000', colorText: '#fff' }] });
    const untagged = makeEvent({ tags: [] });
    const result = filterByOptions([tagged, untagged], { categories: ['sport'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(tagged.id);
  });

  test('excludes past events (already ended)', () => {
    const past = makeEvent({
      start: new Date(Date.now() - 5 * 3600_000).toISOString(),
      end: new Date(Date.now() - 1 * 3600_000).toISOString(), // ended 1h ago
    });
    const future = makeEvent({ start: new Date(Date.now() + 1 * 3600_000).toISOString() });
    const result = filterByOptions([past, future], {});
    expect(result.some(e => e.id === future.id)).toBe(true);
    expect(result.some(e => e.id === past.id)).toBe(false);
  });

  test('includes ongoing events (started but not ended)', () => {
    const ongoing = makeEvent({
      start: new Date(Date.now() - 30 * 60_000).toISOString(),  // started 30m ago
      end: new Date(Date.now() + 30 * 60_000).toISOString(),    // ends in 30m
    });
    const result = filterByOptions([ongoing], {});
    expect(result).toHaveLength(1);
  });
});

describe('calcCategoryCounts', () => {
  test('counts only bookable events', () => {
    const bookable = makeEvent({ bookable: true, tags: [{ code: 'sport', text: 'Sport', colorBackground: '#000', colorText: '#fff' }] });
    const nonBookable = makeEvent({ bookable: false, tags: [{ code: 'sport', text: 'Sport', colorBackground: '#000', colorText: '#fff' }] });
    const counts = calcCategoryCounts([bookable, nonBookable]);
    expect(counts['sport']).toBe(1);
  });

  test('sums across multiple events with same tag', () => {
    const a = makeEvent({ bookable: true, tags: [{ code: 'art', text: 'Art', colorBackground: '#000', colorText: '#fff' }] });
    const b = makeEvent({ bookable: true, tags: [{ code: 'art', text: 'Art', colorBackground: '#000', colorText: '#fff' }] });
    const counts = calcCategoryCounts([a, b]);
    expect(counts['art']).toBe(2);
  });
});

describe('getTopCategories', () => {
  test('returns codes sorted by count descending', () => {
    const counts = { sport: 5, art: 2, music: 8 };
    expect(getTopCategories(counts, 3)).toEqual(['music', 'sport', 'art']);
  });

  test('respects limit', () => {
    const counts = { a: 3, b: 2, c: 1 };
    expect(getTopCategories(counts, 2)).toHaveLength(2);
  });
});

describe('groupEventsByDate', () => {
  test('groups events sharing a date', () => {
    const date = new Date(Date.now() + 3600_000);
    const a = makeEvent({ start: date.toISOString() });
    const b = makeEvent({ start: date.toISOString() });
    const grouped = groupEventsByDate([a, b]);
    const key = date.toDateString();
    expect(grouped[key]).toHaveLength(2);
  });
});


// ── dashboard / last-minute selection ────────────────────────────────────────
// Moving these derivations out of the store dropped the date filtering the
// store used to apply. Sorting ascending and slicing the first N off an
// unfiltered list yields the *oldest* attending events, so after the event
// weekend the dashboard would show nothing but past ones.

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-06-01T12:00:00Z').getTime();

const at = (offsetHours: number, overrides: Partial<ExtendedEvent> = {}) =>
  makeEvent({
    start: new Date(NOW + offsetHours * HOUR).toISOString(),
    end: new Date(NOW + (offsetHours + 1) * HOUR).toISOString(),
    attendingOrHost: true,
    ...overrides,
  });

describe('selectDashboardEvents', () => {
  test('excludes events that have already finished', () => {
    const result = selectDashboardEvents([at(-48), at(-24), at(2)], NOW);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(new Date(NOW + 2 * HOUR).toISOString());
  });

  test('keeps an event that has started but not ended', () => {
    // Happening right now — the dashboard is exactly where this belongs.
    const ongoing = at(-0.5);
    expect(selectDashboardEvents([ongoing], NOW)).toHaveLength(1);
  });

  test('drops a started event once its end has passed', () => {
    expect(selectDashboardEvents([at(-5)], NOW)).toHaveLength(0);
  });

  test('keeps an open-ended future event but not an open-ended past one', () => {
    expect(selectDashboardEvents([at(3, { end: null } as any)], NOW)).toHaveLength(1);
    expect(selectDashboardEvents([at(-3, { end: null } as any)], NOW)).toHaveLength(0);
  });

  test('ignores events the user is not attending or hosting', () => {
    expect(selectDashboardEvents([at(2, { attendingOrHost: false })], NOW)).toHaveLength(0);
  });

  test('returns soonest first, so slicing takes the next events not the oldest', () => {
    const result = selectDashboardEvents([at(10), at(2), at(6)], NOW);
    expect(result.map(e => e.start)).toEqual([
      new Date(NOW + 2 * HOUR).toISOString(),
      new Date(NOW + 6 * HOUR).toISOString(),
      new Date(NOW + 10 * HOUR).toISOString(),
    ]);
  });
});

describe('selectLastMinuteEvents', () => {
  test('includes bookable events inside the window', () => {
    const result = selectLastMinuteEvents([at(1, { bookable: true })], 2, NOW);
    expect(result).toHaveLength(1);
  });

  test('excludes events past the window and events already started', () => {
    expect(selectLastMinuteEvents([at(5, { bookable: true })], 2, NOW)).toHaveLength(0);
    expect(selectLastMinuteEvents([at(-1, { bookable: true })], 2, NOW)).toHaveLength(0);
  });

  test('excludes non-bookable events inside the window', () => {
    expect(selectLastMinuteEvents([at(1, { bookable: false })], 2, NOW)).toHaveLength(0);
  });

  test('the window moves with the clock rather than staying where it started', () => {
    // `now` used to be frozen at first render while the cutoff kept moving,
    // so the window silently widened for the whole session.
    const event = at(3, { bookable: true });
    expect(selectLastMinuteEvents([event], 2, NOW)).toHaveLength(0);
    expect(selectLastMinuteEvents([event], 2, NOW + 2 * HOUR)).toHaveLength(1);
  });
});

