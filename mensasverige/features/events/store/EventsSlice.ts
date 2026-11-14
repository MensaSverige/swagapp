import { StateCreator } from 'zustand';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { Event, ExternalRoot, Tag } from '../../../api_schema/types';
import { INTEREST_TAGS } from '../utils/interestTags';
import { DEFAULT_LOCAL_EVENT_FILTER, LocalEventFilter } from '../utils/localEventFilter';

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
  // Shared status, not a derivation: a module-level guard makes only the first
  // useEvents() caller actually fetch, so per-hook state leaves every other
  // consumer showing an empty list instead of a spinner or an error.
  eventsError: Error | null;
  eventsLastFetched: Date | null;
  eventsInitialized: boolean;
  interestTags: Tag[];

  // Parent event info
  eventInfo: ExternalRoot | null;
  eventInfoLoading: boolean;

  // Main events (riksträffar and local calendar events) and focus mode
  mainEvents: Event[];
  mainEventsLoading: boolean;
  mainEventsInitialized: boolean;
  selectedMainEventId: string | null;
  // Set when the user leaves a main event; stops auto-select for the session.
  autoSelectDismissed: boolean;

  // Active filter (source of truth — derivations live in useEvents useMemo)
  currentEventFilter: EventFilterOptions;
  // Local events by local group or distance; saved on the device by useLocalEventFilter.
  localEventFilter: LocalEventFilter;

  setEvents: (events: ExtendedEvent[]) => void;
  setEventsRefreshing: (v: boolean) => void;
  setEventsError: (v: Error | null) => void;
  setEventsLastFetched: (v: Date | null) => void;
  setEventsInitialized: (v: boolean) => void;
  setInterestTags: (tags: Tag[]) => void;

  setEventInfo: (v: ExternalRoot | null) => void;
  setEventInfoLoading: (v: boolean) => void;

  setMainEvents: (events: Event[]) => void;
  setMainEventsLoading: (v: boolean) => void;
  setMainEventsInitialized: (v: boolean) => void;
  selectMainEvent: (id: string) => void;
  /** Header back arrow: clear the selection and dismiss auto-select for the session. */
  leaveMainEvent: () => void;
  /** Auto-select (does not touch the dismissed flag). */
  autoSelectMainEvent: (id: string) => void;

  setCurrentEventFilter: (filter: EventFilterOptions) => void;
  resetFilters: () => void;
  setLocalEventFilter: (filter: LocalEventFilter) => void;

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
  eventsError: null,
  eventsLastFetched: null,
  eventsInitialized: false,
  interestTags: INTEREST_TAGS,

  eventInfo: null,
  eventInfoLoading: false,

  mainEvents: [],
  mainEventsLoading: false,
  mainEventsInitialized: false,
  selectedMainEventId: null,
  autoSelectDismissed: false,

  currentEventFilter: defaultEventFilter,
  localEventFilter: DEFAULT_LOCAL_EVENT_FILTER,

  setEvents: (events) => set({ events }),
  setEventsRefreshing: (eventsRefreshing) => set({ eventsRefreshing }),
  setEventsError: (eventsError) => set({ eventsError }),
  setEventsLastFetched: (eventsLastFetched) => set({ eventsLastFetched }),
  setEventsInitialized: (eventsInitialized) => set({ eventsInitialized }),
  setInterestTags: (interestTags) => set({ interestTags }),

  setEventInfo: (eventInfo) => set({ eventInfo }),
  setEventInfoLoading: (eventInfoLoading) => set({ eventInfoLoading }),

  setMainEvents: (mainEvents) => set({ mainEvents }),
  setMainEventsLoading: (mainEventsLoading) => set({ mainEventsLoading }),
  setMainEventsInitialized: (mainEventsInitialized) => set({ mainEventsInitialized }),
  selectMainEvent: (selectedMainEventId) => set({ selectedMainEventId }),
  leaveMainEvent: () => set({ selectedMainEventId: null, autoSelectDismissed: true }),
  autoSelectMainEvent: (selectedMainEventId) => set({ selectedMainEventId }),

  setCurrentEventFilter: (currentEventFilter) => set({ currentEventFilter }),
  resetFilters: () => set({ currentEventFilter: defaultEventFilter }),
  setLocalEventFilter: (localEventFilter) => set({ localEventFilter }),

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
