import { StateCreator } from 'zustand';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { ExternalRoot, Tag } from '../../../api_schema/types';
import { INTEREST_TAGS } from '../utils/interestTags';

export interface EventFilterOptions {
  attendingOrHost?: boolean | null;
  bookable?: boolean | null;
  official?: boolean | null;
  categories?: string[];
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export interface EventsSlice {
  // Raw events
  events: ExtendedEvent[];
  eventsRefreshing: boolean;
  eventsLastFetched: Date | null;
  eventsInitialized: boolean;
  interestTags: Tag[];

  // Parent event info
  eventInfo: ExternalRoot | null;
  eventInfoLoading: boolean;

  // Active filter (source of truth — derivations live in useEvents useMemo)
  currentEventFilter: EventFilterOptions;

  setEvents: (events: ExtendedEvent[]) => void;
  setEventsRefreshing: (v: boolean) => void;
  setEventsLastFetched: (v: Date | null) => void;
  setEventsInitialized: (v: boolean) => void;
  setInterestTags: (tags: Tag[]) => void;

  setEventInfo: (v: ExternalRoot | null) => void;
  setEventInfoLoading: (v: boolean) => void;

  setCurrentEventFilter: (filter: EventFilterOptions) => void;
  resetFilters: () => void;

  addOrUpdateEvent: (event: ExtendedEvent) => void;
}

export const defaultEventFilter: EventFilterOptions = {
  attendingOrHost: null,
  bookable: null,
  official: null,
  categories: [],
  dateFrom: new Date(),
  dateTo: null,
};

export const createEventsSlice: StateCreator<EventsSlice> = (set, get) => ({
  events: [],
  eventsRefreshing: false,
  eventsLastFetched: null,
  eventsInitialized: false,
  interestTags: INTEREST_TAGS,

  eventInfo: null,
  eventInfoLoading: false,

  currentEventFilter: defaultEventFilter,

  setEvents: (events) => set({ events }),
  setEventsRefreshing: (eventsRefreshing) => set({ eventsRefreshing }),
  setEventsLastFetched: (eventsLastFetched) => set({ eventsLastFetched }),
  setEventsInitialized: (eventsInitialized) => set({ eventsInitialized }),
  setInterestTags: (interestTags) => set({ interestTags }),

  setEventInfo: (eventInfo) => set({ eventInfo }),
  setEventInfoLoading: (eventInfoLoading) => set({ eventInfoLoading }),

  setCurrentEventFilter: (currentEventFilter) => set({ currentEventFilter }),
  resetFilters: () => set({ currentEventFilter: defaultEventFilter }),

  addOrUpdateEvent: (event) => {
    const { events } = get();
    const idx = events.findIndex(e => e.id === event.id);
    const updated =
      idx >= 0
        ? [...events.slice(0, idx), event, ...events.slice(idx + 1)]
        : [...events, event];
    set({ events: updated });
  },
});
