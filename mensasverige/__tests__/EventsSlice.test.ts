/**
 * Unit tests for EventsSlice.setEvents derivations.
 * Uses a real Zustand store so we exercise the actual reducer logic.
 */
import { createEventsSlice } from '../features/events/store/EventsSlice';
import { ExtendedEvent } from '../features/events/types/eventUtilTypes';
import { createStore } from 'zustand';

// Minimal ExtendedEvent factory
const makeEvent = (overrides: Partial<ExtendedEvent> = {}): ExtendedEvent => {
  const start = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h from now
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

describe('EventsSlice.setEvents', () => {
  test('stores events in state', () => {
    const store = buildStore();
    const events = [makeEvent(), makeEvent()];
    store.getState().setEvents(events);
    expect(store.getState().events).toHaveLength(2);
  });

  test('dashboard bucket includes only attending/host events', () => {
    const store = buildStore();
    const attending = makeEvent({ attending: true, attendingOrHost: true });
    const notAttending = makeEvent({ attending: false, attendingOrHost: false });
    store.getState().setEvents([attending, notAttending]);

    const grouped = store.getState().dashboardGroupedEvents;
    const allDashboard = Object.values(grouped).flat();
    expect(allDashboard.every(e => e.attendingOrHost)).toBe(true);
    expect(allDashboard.some(e => e.id === notAttending.id)).toBe(false);
  });

  test('dashboard caps at 3 events', () => {
    const store = buildStore();
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({ attending: true, attendingOrHost: true,
        start: new Date(Date.now() + (i + 1) * 3600_000).toISOString() })
    );
    store.getState().setEvents(events);
    const count = Object.values(store.getState().dashboardGroupedEvents).flat().length;
    expect(count).toBeLessThanOrEqual(3);
    expect(store.getState().dashboardHasMore).toBe(true);
  });

  test('category event counts only count bookable events', () => {
    const store = buildStore();
    const bookable = makeEvent({ bookable: true, tags: [{ code: 'sport', text: 'Sport', colorBackground: '#000', colorText: '#fff' }] });
    const nonBookable = makeEvent({ bookable: false, tags: [{ code: 'sport', text: 'Sport', colorBackground: '#000', colorText: '#fff' }] });
    store.getState().setEvents([bookable, nonBookable]);

    const counts = store.getState().categoryEventCounts;
    expect(counts['sport']).toBe(1);
  });

  test('last-minute events are bookable and start within 2 hours', () => {
    const store = buildStore();
    const soon = makeEvent({
      bookable: true,
      start: new Date(Date.now() + 30 * 60_000).toISOString(), // 30 min from now
    });
    const far = makeEvent({
      bookable: true,
      start: new Date(Date.now() + 5 * 3600_000).toISOString(), // 5h from now
    });
    store.getState().setEvents([soon, far]);

    const lm = store.getState().lastMinuteEvents;
    expect(lm.some(e => e.id === soon.id)).toBe(true);
    expect(lm.some(e => e.id === far.id)).toBe(false);
  });

  test('setCurrentEventFilter updates filteredGroupedEvents', () => {
    const store = buildStore();
    const bookable = makeEvent({ bookable: true });
    const notBookable = makeEvent({ bookable: false });
    store.getState().setEvents([bookable, notBookable]);

    store.getState().setCurrentEventFilter({ bookable: true });

    const filtered = Object.values(store.getState().filteredGroupedEvents).flat();
    expect(filtered.every(e => e.bookable)).toBe(true);
    expect(filtered.some(e => e.id === notBookable.id)).toBe(false);
  });

  test('resetFilters restores all events to filtered view', () => {
    const store = buildStore();
    const events = [makeEvent({ bookable: true }), makeEvent({ bookable: false })];
    store.getState().setEvents(events);
    store.getState().setCurrentEventFilter({ bookable: true });
    store.getState().resetFilters();

    const count = Object.values(store.getState().filteredGroupedEvents).flat().length;
    expect(count).toBe(2);
  });
});
