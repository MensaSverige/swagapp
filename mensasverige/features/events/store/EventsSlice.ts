import {StateCreator} from 'zustand';
import { Event } from '../../../api_schema/types';
import { GroupedEvents, getAllEventsGrouped, getUpcomingAttendingEvents, findNextEvent, EventFilter } from '../utils/eventUtils';

// Import EventFilterOptions type
export interface EventFilterOptions {
  attending?: boolean | null;
  bookable?: boolean | null;
  official?: boolean | null;
  categories?: string[];
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export interface EventsSlice {
  // Raw events data
  events: Event[];
  eventsRefreshing: boolean;
  eventsLastFetched: Date | null;

  // Dashboard events (attending + upcoming with limit)
  dashboardEvents: Event[];
  dashboardGroupedEvents: GroupedEvents;
  dashboardHasMore: boolean;
  dashboardNextEvent: Event | null;
  dashboardLoading: boolean;
  dashboardError: Error | null;

  // Schedule events (all events)
  scheduleGroupedEvents: GroupedEvents;
  scheduleNextEvent: Event | null;
  scheduleLoading: boolean;
  scheduleError: Error | null;

  // Filtered events (for screens with active filters)
  filteredGroupedEvents: GroupedEvents;
  filteredNextEvent: Event | null;
  filteredHasMore: boolean;
  filteredLoading: boolean;
  filteredError: Error | null;
  filteredTotalCount: number;
  filteredCount: number;

  // Event filters
  currentEventFilter: EventFilterOptions;
  currentApiFilter: EventFilter;

  // Derived analytics
  categoryEventCounts: Record<string, number>;
  topCategories: string[];
  lastMinuteEvents: Event[];
  hasLastMinuteEvents: boolean;

  setEvents: (events: Event[]) => void;
  setEventsRefreshing: (eventsRefreshing: boolean) => void;
  setEventsLastFetched: (eventsLastFetched: Date | null) => void;

  // Dashboard events actions
  setDashboardEvents: (events: Event[]) => void;
  setDashboardGroupedEvents: (groupedEvents: GroupedEvents) => void;
  setDashboardHasMore: (hasMore: boolean) => void;
  setDashboardNextEvent: (event: Event | null) => void;
  setDashboardLoading: (loading: boolean) => void;
  setDashboardError: (error: Error | null) => void;

  // Schedule events actions
  setScheduleGroupedEvents: (groupedEvents: GroupedEvents) => void;
  setScheduleNextEvent: (event: Event | null) => void;
  setScheduleLoading: (loading: boolean) => void;
  setScheduleError: (error: Error | null) => void;

  // Filtered events actions
  setFilteredGroupedEvents: (groupedEvents: GroupedEvents) => void;
  setFilteredNextEvent: (event: Event | null) => void;
  setFilteredHasMore: (hasMore: boolean) => void;
  setFilteredLoading: (loading: boolean) => void;
  setFilteredError: (error: Error | null) => void;
  setFilteredCounts: (total: number, filtered: number) => void;

  // Filter actions
  setCurrentEventFilter: (filter: EventFilterOptions) => void;
  setCurrentApiFilter: (filter: EventFilter) => void;
  resetFilters: () => void;
  
  // Utility action to apply filters and update filtered events
  applyFiltersAndUpdateEvents: (events?: Event[]) => void;
  
  // Action to add or update a single event
  addOrUpdateEvent: (event: Event) => void;
}

const defaultEventFilter: EventFilterOptions = {
  attending: null,
  bookable: null,
  official: null,
  categories: [],
  dateFrom: null,
  dateTo: null,
};

const defaultApiFilter: EventFilter = {};

// Helper function to apply client-side filtering
const applyClientSideFilters = (events: Event[], eventFilter: EventFilterOptions): Event[] => {
  let filteredEvents = [...events];
  
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

// Helper function to create API filter params
const createApiFilterParams = (eventFilter: EventFilterOptions) => {
  if (!eventFilter) return undefined;
  
  const params: { attending?: boolean; bookable?: boolean; official?: boolean } = {};
  
  // Only include defined non-null values for API
  if (eventFilter.attending !== null && eventFilter.attending !== undefined) {
    params.attending = eventFilter.attending;
  }
  if (eventFilter.bookable !== null && eventFilter.bookable !== undefined) {
    params.bookable = eventFilter.bookable;
  }
  if (eventFilter.official !== null && eventFilter.official !== undefined) {
    params.official = eventFilter.official;
  }
  
  return Object.keys(params).length > 0 ? params : undefined;
};

// Helper function to calculate category event counts
const calculateCategoryEventCounts = (events: Event[]): Record<string, number> => {
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

// Helper function to filter last minute events
const filterLastMinuteEvents = (events: Event[]): Event[] => {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return events.filter(event => {
    if (!event.start || !event.bookable) return false;
    
    const eventStart = new Date(event.start);
    return eventStart >= now && eventStart <= twoHoursFromNow;
  });
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

  // Schedule events
  scheduleGroupedEvents: {},
  scheduleNextEvent: null,
  scheduleLoading: false,
  scheduleError: null,

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
  currentApiFilter: defaultApiFilter,

  // Derived analytics
  categoryEventCounts: {},
  topCategories: [],
  lastMinuteEvents: [],
  hasLastMinuteEvents: false,

  setEvents: (events: Event[]) => {
    set(() => ({events: events}));
    
    // Auto-update derived event lists when main events are set
    const state = get();
    
    try {
      // Update schedule events (all events grouped)
      const scheduleGroupedEvents = getAllEventsGrouped(events);
      const scheduleNextEvent = findNextEvent(scheduleGroupedEvents, true);
      
      // Update dashboard events (attending events only)
      const attendingEvents = events.filter(event => event.attending);
      const dashboardResult = getUpcomingAttendingEvents(attendingEvents, 3);
      const dashboardNextEvent = findNextEvent(dashboardResult.groupedEvents, true);
      
      // Calculate derived analytics
      const categoryEventCounts = calculateCategoryEventCounts(events);
      const topCategories = getTopCategories(categoryEventCounts);
      const lastMinuteEventsData = filterLastMinuteEvents(events);
      const hasLastMinuteEventsData = lastMinuteEventsData.length > 0;

      set({
        scheduleGroupedEvents,
        scheduleNextEvent,
        scheduleError: null,
        dashboardEvents: attendingEvents,
        dashboardGroupedEvents: dashboardResult.groupedEvents,
        dashboardHasMore: dashboardResult.hasMore,
        dashboardNextEvent,
        dashboardError: null,
        // Update derived analytics
        categoryEventCounts,
        topCategories,
        lastMinuteEvents: lastMinuteEventsData,
        hasLastMinuteEvents: hasLastMinuteEventsData,
      });

      // Also update filtered events
      state.applyFiltersAndUpdateEvents(events);
    } catch (error) {
      console.error('Error updating derived event lists:', error);
      set({
        scheduleError: error as Error,
        dashboardError: error as Error,
      });
    }
  },
  setEventsRefreshing: (eventsRefreshing: boolean) => set({eventsRefreshing}),
  setEventsLastFetched: (eventsLastFetched: Date | null) =>
    set({eventsLastFetched}),

  // Dashboard events actions
  setDashboardEvents: (events: Event[]) => set({dashboardEvents: events}),
  setDashboardGroupedEvents: (groupedEvents: GroupedEvents) => set({dashboardGroupedEvents: groupedEvents}),
  setDashboardHasMore: (hasMore: boolean) => set({dashboardHasMore: hasMore}),
  setDashboardNextEvent: (event: Event | null) => set({dashboardNextEvent: event}),
  setDashboardLoading: (loading: boolean) => set({dashboardLoading: loading}),
  setDashboardError: (error: Error | null) => set({dashboardError: error}),

  // Schedule events actions
  setScheduleGroupedEvents: (groupedEvents: GroupedEvents) => set({scheduleGroupedEvents: groupedEvents}),
  setScheduleNextEvent: (event: Event | null) => set({scheduleNextEvent: event}),
  setScheduleLoading: (loading: boolean) => set({scheduleLoading: loading}),
  setScheduleError: (error: Error | null) => set({scheduleError: error}),

  // Filtered events actions
  setFilteredGroupedEvents: (groupedEvents: GroupedEvents) => set({filteredGroupedEvents: groupedEvents}),
  setFilteredNextEvent: (event: Event | null) => set({filteredNextEvent: event}),
  setFilteredHasMore: (hasMore: boolean) => set({filteredHasMore: hasMore}),
  setFilteredLoading: (loading: boolean) => set({filteredLoading: loading}),
  setFilteredError: (error: Error | null) => set({filteredError: error}),
  setFilteredCounts: (total: number, filtered: number) => set({filteredTotalCount: total, filteredCount: filtered}),

  // Filter actions
  setCurrentEventFilter: (filter: EventFilterOptions) => {
    set({currentEventFilter: filter});
    // Auto-apply filters when filter changes
    const state = get();
    state.applyFiltersAndUpdateEvents();
  },
  setCurrentApiFilter: (filter: EventFilter) => set({currentApiFilter: filter}),
  resetFilters: () => {
    set({
      currentEventFilter: defaultEventFilter,
      currentApiFilter: defaultApiFilter,
    });
    // Auto-apply filters when reset
    const state = get();
    state.applyFiltersAndUpdateEvents();
  },

  // Apply filters and update filtered events
  applyFiltersAndUpdateEvents: (events?: Event[]) => {
    const state = get();
    const eventsToFilter = events || state.events;
    
    try {
      // Apply client-side filtering
      const clientFilteredEvents = applyClientSideFilters(eventsToFilter, state.currentEventFilter);
      
      // Group filtered events
      const filteredGroupedEvents = getAllEventsGrouped(clientFilteredEvents);
      
      // Find next filtered event
      const filteredNextEvent = findNextEvent(filteredGroupedEvents, true);
      
      // Calculate counts
      const totalCount = eventsToFilter.length;
      const filteredCount = clientFilteredEvents.length;
      
      set({
        filteredGroupedEvents,
        filteredNextEvent,
        filteredError: null,
        filteredTotalCount: totalCount,
        filteredCount: filteredCount,
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      set({
        filteredError: error as Error,
      });
    }
  },

  // Add or update a single event
  addOrUpdateEvent: (event: Event) => {
    const state = get();
    const existingEventIndex = state.events.findIndex(e => e.id === event.id);
    
    let updatedEvents: Event[];
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
