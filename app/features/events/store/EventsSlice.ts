import {StateCreator} from 'zustand';
import EventWithLocation, {
  isEventWithLocation,
} from '../types/eventWithLocation';
import FutureEvent from '../types/futureEvent';
import FutureUserEvent from '../types/futureUserEvent';
import FutureUserEventWithLocation, {
  isFutureUserEventWithLocation,
} from '../types/futureUserEventWithLocation';

export interface EventsSlice {
  visibleEvents: (FutureEvent | FutureUserEvent)[];
  eventsWithLocation: (EventWithLocation | FutureUserEventWithLocation)[];
  userEvents: FutureUserEvent[];
  showUserEvents: boolean;
  staticEvents: FutureEvent[];
  externalEvents: FutureEvent[];
  showStaticEvents: boolean;
  eventsRefreshing: boolean;
  eventsLastFetched: Date | null;

  setUserEvents: (events: FutureUserEvent[]) => void;
  setShowUserEvents: (showUserEvents: boolean) => void;
  setStaticEvents: (events: FutureEvent[]) => void;
  setExternalEvents: (events: FutureEvent[]) => void;
  setShowStaticEvents: (showStaticEvents: boolean) => void;
  setEventsRefreshing: (eventsRefreshing: boolean) => void;
  setEventsLastFetched: (eventsLastFetched: Date | null) => void;
  updateVisibleEvents: () => void;
  updateEventsWithLocation: () => void;
}

export const createEventsSlice: StateCreator<EventsSlice> = (set, get) => ({
  visibleEvents: [],
  eventsWithLocation: [],
  userEvents: [],
  showUserEvents: true,
  staticEvents: [],
  externalEvents: [],
  showStaticEvents: true,
  eventsRefreshing: false,
  eventsLastFetched: null,

  setUserEvents: (events: FutureUserEvent[]) => {
    set(() => ({userEvents: events}));
    get().updateVisibleEvents();
    get().updateEventsWithLocation();
  },
  setShowUserEvents: (showUserEvents: boolean) => {
    set(() => ({showUserEvents}));
    get().updateVisibleEvents();
    get().updateEventsWithLocation();
  },
  setStaticEvents: (events: FutureEvent[]) => {
    set(() => ({staticEvents: events}));
    get().updateVisibleEvents();
    get().updateEventsWithLocation();
  },
  setExternalEvents: (events: FutureEvent[]) => {
    set(() => ({externalEvents: events}));
    get().updateVisibleEvents();
    get().updateEventsWithLocation();
  },
  setShowStaticEvents: (showStaticEvents: boolean) => {
    set(() => ({showStaticEvents}));
    get().updateVisibleEvents();
    get().updateEventsWithLocation();
  },
  setEventsRefreshing: (eventsRefreshing: boolean) => set({eventsRefreshing}),
  setEventsLastFetched: (eventsLastFetched: Date | null) =>
    set({eventsLastFetched}),
  updateVisibleEvents: () =>
    set(state => ({
      visibleEvents: [
        ...(state.showUserEvents ? state.userEvents : []),
        ...(state.showStaticEvents ? state.staticEvents : []),
      ],
    })),
  updateEventsWithLocation: () =>
    set(state => {
      const eventsWithLocation: (
        | EventWithLocation
        | FutureUserEventWithLocation
      )[] = [
        ...(state.staticEvents.filter(
          isEventWithLocation,
        ) as EventWithLocation[]),
        ...(state.userEvents.filter(
          isFutureUserEventWithLocation,
        ) as FutureUserEventWithLocation[]),
      ];

      return {eventsWithLocation};
    }),
});
