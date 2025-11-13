import {StateCreator} from 'zustand';
import { GroupedEvents, getAllEventsGrouped, getUpcomingAttendingEvents, findNextEvent, EventFilter, ExtendedEvent, groupEventsByDate } from '../utils/eventUtils';

// Import EventFilterOptions type
export interface EventFilterOptions {
  attendingOrHost?: boolean | null;
  bookable?: boolean | null;
  official?: boolean | null;
  categories?: string[];
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export interface EventsSlice {
  // Raw events data
  events: ExtendedEvent[];
  eventsRefreshing: boolean;
  eventsLastFetched: Date | null;

  // Dashboard events (attending + upcoming with limit)
  dashboardEvents: ExtendedEvent[];
  dashboardGroupedEvents: GroupedEvents;
  dashboardHasMore: boolean;
  dashboardNextEvent: ExtendedEvent | null;
  dashboardLoading: boolean;
  dashboardError: Error | null;

  // Filtered events (for screens with active filters)
  filteredGroupedEvents: GroupedEvents;
  filteredNextEvent: ExtendedEvent | null;
  filteredHasMore: boolean;
  filteredLoading: boolean;
  filteredError: Error | null;
  filteredTotalCount: number;
  filteredCount: number;

  // Event filters
  currentEventFilter: EventFilterOptions;

  // Derived analytics
  categoryEventCounts: Record<string, number>;
  topCategories: string[];
  lastMinuteEvents: ExtendedEvent[];
  hasLastMinuteEvents: boolean;

  setEvents: (events: ExtendedEvent[]) => void;
  setEventsRefreshing: (eventsRefreshing: boolean) => void;
  setEventsLastFetched: (eventsLastFetched: Date | null) => void;

  // Dashboard events actions
  setDashboardEvents: (events: ExtendedEvent[]) => void;
  setDashboardGroupedEvents: (groupedEvents: GroupedEvents) => void;
  setDashboardHasMore: (hasMore: boolean) => void;
  setDashboardNextEvent: (event: ExtendedEvent | null) => void;
  setDashboardLoading: (loading: boolean) => void;
  setDashboardError: (error: Error | null) => void;

  // Filtered events actions
  setFilteredGroupedEvents: (groupedEvents: GroupedEvents) => void;
  setFilteredNextEvent: (event: ExtendedEvent | null) => void;
  setFilteredHasMore: (hasMore: boolean) => void;
  setFilteredLoading: (loading: boolean) => void;
  setFilteredError: (error: Error | null) => void;
  setFilteredCounts: (total: number, filtered: number) => void;

  // Filter actions
  setCurrentEventFilter: (filter: EventFilterOptions) => void;
  resetFilters: () => void;
  
  // Utility action to apply filters and update filtered events
  // applyFiltersAndUpdateEvents: (events?: ExtendedEvent[]) => void;
  
  // Action to add or update a single event
  addOrUpdateEvent: (event: ExtendedEvent) => void;
}

const defaultEventFilter: EventFilterOptions = {
  attendingOrHost: null,
  bookable: null,
  official: null,
  categories: [],
  dateFrom: new Date(),
  dateTo: null,
};

const defaultApiFilter: EventFilter = {};

// Helper function to apply client-side filtering
const filterEvents = (events: ExtendedEvent[], eventFilter: EventFilterOptions): ExtendedEvent[] => {
  let filteredEvents = [...events];
  
  // Apply attendingOrHost filtering
  if (eventFilter?.attendingOrHost !== null && eventFilter?.attendingOrHost !== undefined) {
    filteredEvents = filteredEvents.filter(event => {
      return event.attendingOrHost === eventFilter.attendingOrHost;
    });
  }
  
  // Apply bookable filtering
  if (eventFilter?.bookable !== null && eventFilter?.bookable !== undefined) {
    filteredEvents = filteredEvents.filter(event => {
      return event.bookable === eventFilter.bookable;
    });
  }
  
  // Apply official filtering
  if (eventFilter?.official !== null && eventFilter?.official !== undefined) {
    filteredEvents = filteredEvents.filter(event => {
      return event.official === eventFilter.official;
    });
  }
  
  // Apply category filtering
  if (eventFilter?.categories && eventFilter.categories.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      if (!event.tags || event.tags.length === 0) {
        return false;
      }
      
      return event.tags.some(tag => eventFilter.categories!.includes(tag.code));
    });
  }
  
  // Apply date range filtering - always filter from "now" by default
  filteredEvents = filteredEvents.filter(event => {
    if (!event.start) return false;
    
    const eventDate = new Date(event.start);
    
    // Use dateFrom if explicitly set, otherwise use current time as default
    const fromDate = eventFilter?.dateFrom ? new Date(eventFilter.dateFrom) : new Date();
    if (eventDate < fromDate) return false;
    
    // Check if event is before dateTo (if specified) - use exact datetime
    if (eventFilter?.dateTo) {
      const toDate = new Date(eventFilter.dateTo);
      if (eventDate > toDate) return false;
    }
    
    return true;
  });
  
  return filteredEvents;
};

// Helper function to calculate category event counts
const calculateCategoryEventCounts = (events: ExtendedEvent[]): Record<string, number> => {
  const categoryEventCounts: Record<string, number> = {};
  
  events
    .filter(event => event.bookable) // Only count bookable events
    .forEach(event => {
      event.tags?.forEach(tag => {
        if (tag.code) {
          categoryEventCounts[tag.code] = (categoryEventCounts[tag.code] || 0) + 1;
        }
      });
    });
  
  return categoryEventCounts;
};

// Helper function to get top categories by event count
const getTopCategories = (categoryEventCounts: Record<string, number>, limit: number = 5): string[] => {
  return Object.entries(categoryEventCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, limit)
    .map(([code]) => code);
};

export const createEventsSlice: StateCreator<EventsSlice> = (set, get) => ({
  // Raw events data
  events: [],
  eventsRefreshing: false,
  eventsLastFetched: null,

  // Dashboard events
  dashboardEvents: [],
  dashboardGroupedEvents: {},
  dashboardHasMore: false,
  dashboardNextEvent: null,
  dashboardLoading: false,
  dashboardError: null,

  // Filtered events
  filteredGroupedEvents: {},
  filteredNextEvent: null,
  filteredHasMore: false,
  filteredLoading: false,
  filteredError: null,
  filteredTotalCount: 0,
  filteredCount: 0,

  // Event filters
  currentEventFilter: defaultEventFilter,

  // Derived analytics
  categoryEventCounts: {},
  topCategories: [],
  lastMinuteEvents: [],
  hasLastMinuteEvents: false,

  setEvents: (events: ExtendedEvent[]) => {
    set(() => ({events: events}));
    
    // Auto-update derived event lists when main events are set
    const state = get();
    
    try {
      // Update schedule events (all events grouped)
      const allGroupedEvents = getAllEventsGrouped(events);
      const nextEvent = findNextEvent(allGroupedEvents, true);
      
      // Update dashboard events (attending events only)
      const dashboardFilter: EventFilterOptions = { 
        attendingOrHost: true, 
        bookable: null, 
        official: null, 
        categories: [], 
        dateFrom: new Date(), 
        dateTo: null };
      const dashboardEvents = filterEvents(events, dashboardFilter);

      const dashboardGroupedEvents = groupEventsByDate(dashboardEvents.slice(0, 3));
      
      // update filtered events 
      const filteredEvents = filterEvents(events, state.currentEventFilter);
      const filteredGroupedEvents = groupEventsByDate(filteredEvents);

      // Calculate derived analytics
      const categoryEventCounts = calculateCategoryEventCounts(events);
      const topCategories = getTopCategories(categoryEventCounts);
      const lastMinuteEventsData = filterEvents(events, { 
        attendingOrHost: null, 
        bookable: true,
        official: null,
        categories: [],
        dateFrom: new Date(),
        dateTo: new Date(new Date().getTime() + 2 * 60 * 60 * 1000) // next 2 hours
      });
      const hasLastMinuteEventsData = lastMinuteEventsData.length > 0;

      set({
        dashboardEvents,
        dashboardGroupedEvents,
        dashboardHasMore: dashboardEvents.length > 3,
        filteredGroupedEvents,
        filteredCount: filteredEvents.length,
        filteredTotalCount: events.length,
        categoryEventCounts,
        topCategories,
        lastMinuteEvents: lastMinuteEventsData,
        hasLastMinuteEvents: hasLastMinuteEventsData,
      });

    } catch (error) {
      console.error('Error updating derived event lists:', error);
      set({
        dashboardError: error as Error,
      });
    }
  },
  setEventsRefreshing: (eventsRefreshing: boolean) => set({eventsRefreshing}),
  setEventsLastFetched: (eventsLastFetched: Date | null) =>
    set({eventsLastFetched}),

  // Dashboard events actions
  setDashboardEvents: (events: ExtendedEvent[]) => set({dashboardEvents: events}),
  setDashboardGroupedEvents: (groupedEvents: GroupedEvents) => set({dashboardGroupedEvents: groupedEvents}),
  setDashboardHasMore: (hasMore: boolean) => set({dashboardHasMore: hasMore}),
  setDashboardNextEvent: (event: ExtendedEvent | null) => set({dashboardNextEvent: event}),
  setDashboardLoading: (loading: boolean) => set({dashboardLoading: loading}),
  setDashboardError: (error: Error | null) => set({dashboardError: error}),

  // Filtered events actions
  setFilteredGroupedEvents: (groupedEvents: GroupedEvents) => set({filteredGroupedEvents: groupedEvents}),
  setFilteredNextEvent: (event: ExtendedEvent | null) => set({filteredNextEvent: event}),
  setFilteredHasMore: (hasMore: boolean) => set({filteredHasMore: hasMore}),
  setFilteredLoading: (loading: boolean) => set({filteredLoading: loading}),
  setFilteredError: (error: Error | null) => set({filteredError: error}),
  setFilteredCounts: (total: number, filtered: number) => set({filteredTotalCount: total, filteredCount: filtered}),

  // Filter actions
  setCurrentEventFilter: (filter: EventFilterOptions) => {
    set({currentEventFilter: filter});
    const filteredEvents = filterEvents(get().events, filter);
    const filteredGroupedEvents = groupEventsByDate(filteredEvents);
    set({ filteredGroupedEvents, filteredCount: filteredEvents.length, filteredTotalCount: get().events.length });
  },
  resetFilters: () => {
    set({
      currentEventFilter: defaultEventFilter
    });
    const filteredEvents = filterEvents(get().events, defaultEventFilter);
    const filteredGroupedEvents = groupEventsByDate(filteredEvents);
    set({ filteredGroupedEvents, filteredCount: filteredEvents.length, filteredTotalCount: get().events.length });
  },


  // Add or update a single event
  addOrUpdateEvent: (event: ExtendedEvent) => {
    const state = get();
    const existingEventIndex = state.events.findIndex(e => e.id === event.id);
    
    let updatedEvents: ExtendedEvent[];
    if (existingEventIndex >= 0) {
      // Update existing event
      updatedEvents = [...state.events];
      updatedEvents[existingEventIndex] = event;
    } else {
      // Add new event
      updatedEvents = [...state.events, event];
    }
    
    // Use setEvents to trigger all the automatic updates
    state.setEvents(updatedEvents);
  },
});
