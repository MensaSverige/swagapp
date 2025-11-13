import { useEffect, useCallback } from 'react';
import { Event } from '../../../api_schema/types';
import { 
    GroupedEvents,
    findNextEvent
} from '../utils/eventUtils';
import { fetchEvents } from '../services/eventService';
import useStore from '../../common/store/store';
import { EventFilterOptions } from '../store/EventsSlice';

interface UseEventsOptions {
  enableAutoRefresh?: boolean;
  refreshIntervalMs?: number;
  dashboardLimit?: number;
}

interface UseEventsReturn {
  // All events data
  allEvents: Event[];
  
  // Schedule events (all events)
  scheduleGroupedEvents: GroupedEvents;
  scheduleNextEvent: Event | null;
  
  // Dashboard events (attending + upcoming with limit)
  dashboardGroupedEvents: GroupedEvents;
  dashboardNextEvent: Event | null;
  dashboardHasMoreEvents: boolean;
  
  // Filtered events (based on current filters in store)
  filteredGroupedEvents: GroupedEvents;
  filteredNextEvent: Event | null;
  filteredHasMore: boolean;
  filteredTotalCount: number;
  filteredCount: number;
  
  // Shared loading and error states
  loading: boolean;
  error: Error | null;
  refreshing: boolean;
  lastFetched: Date | null;
  
  // Filter state and actions
  currentEventFilter: EventFilterOptions;
  setCurrentEventFilter: (filter: EventFilterOptions) => void;
  resetFilters: () => void;
  
  // Derived analytics
  categoryEventCounts: Record<string, number>;
  topCategories: string[];
  lastMinuteEvents: Event[];
  hasLastMinuteEvents: boolean;
  
  // Actions
  refetch: () => Promise<void>;
  addOrUpdateEvent: (event: Event) => void;
}

export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const { 
    enableAutoRefresh = true, 
    refreshIntervalMs = 60000,
    dashboardLimit = 3
  } = options;
  
  const { 
    // Raw events
    events,
    eventsRefreshing,
    eventsLastFetched,
    setEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    
    // Schedule events (all events)
    scheduleGroupedEvents,
    scheduleNextEvent,
    scheduleLoading,
    scheduleError,
    setScheduleLoading,
    setScheduleError,
    
    // Dashboard events (attending + upcoming with limit)
    dashboardGroupedEvents,
    dashboardNextEvent,
    dashboardHasMore,
    dashboardLoading,
    dashboardError,
    setDashboardLoading,
    setDashboardError,

    // Filters
    currentEventFilter,
    setCurrentEventFilter,
    resetFilters,
    
    // Filtered events
    filteredGroupedEvents,
    filteredNextEvent,
    filteredHasMore,
    filteredTotalCount,
    filteredCount,
    
    // Event management actions
    addOrUpdateEvent,

    // Derived analytics
    categoryEventCounts,
    topCategories,
    lastMinuteEvents,
    hasLastMinuteEvents
  } = useStore();

  // Refetch function that updates both schedule and dashboard
  const refetch = useCallback(async (): Promise<void> => {
    try {
      setEventsRefreshing(true);
      setScheduleLoading(true);
      setDashboardLoading(true);
      
      // Fetch all events - the store will automatically update derived lists
      const allEvents = await fetchEvents();
      
      // Setting events in store will automatically update both schedule and dashboard
      setEvents(allEvents);
      setEventsLastFetched(new Date());
      
    } catch (err) {
      const error = err as Error;
      setScheduleError(error);
      setDashboardError(error);
      console.error('Error fetching events:', err);
    } finally {
      setEventsRefreshing(false);
      setScheduleLoading(false);
      setDashboardLoading(false);
    }
  }, [
    setEvents, 
    setEventsRefreshing, 
    setEventsLastFetched,
    setScheduleLoading, 
    setScheduleError,
    setDashboardLoading,
    setDashboardError
  ]);

  // Initial load
  useEffect(() => {
    const loadEvents = async () => {
      // Only fetch if we don't have events or they're stale
      if (events.length === 0) {
        await refetch();
      }
    };

    loadEvents();
  }, [events.length, refetch]);

  // Auto-refresh next event detection
  useEffect(() => {
    if (!enableAutoRefresh || Object.keys(scheduleGroupedEvents).length === 0) return;

    const updateNextEvent = () => {
      const nextEventFound = findNextEvent(scheduleGroupedEvents, true);
      // Update next event through store actions if different
      if (nextEventFound?.id !== scheduleNextEvent?.id) {
        // The store will handle updating both schedule and dashboard next events
        setEvents(events); // This will trigger auto-update of derived data
      }
    };

    const intervalId = setInterval(updateNextEvent, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [scheduleGroupedEvents, enableAutoRefresh, refreshIntervalMs, scheduleNextEvent, events, setEvents]);

  // Determine overall loading and error states
  const isLoading = scheduleLoading || dashboardLoading;
  const hasError = scheduleError || dashboardError;

  return {
    // All events data
    allEvents: events,
    
    // Schedule events (all events)
    scheduleGroupedEvents,
    scheduleNextEvent,
    
    // Dashboard events (attending + upcoming with limit)
    dashboardGroupedEvents,
    dashboardNextEvent,
    dashboardHasMoreEvents: dashboardHasMore,
    
    // Filtered events (based on current filters in store)
    filteredGroupedEvents,
    filteredNextEvent,
    filteredHasMore,
    filteredTotalCount,
    filteredCount,
    
    // Shared loading and error states
    loading: isLoading,
    error: hasError,
    refreshing: eventsRefreshing,
    lastFetched: eventsLastFetched,
    
    // Filter state and actions
    currentEventFilter,
    setCurrentEventFilter,
    resetFilters,
    
    // Derived analytics
    categoryEventCounts,
    topCategories,
    lastMinuteEvents,
    hasLastMinuteEvents,
    
    // Actions
    refetch,
    addOrUpdateEvent
  };
};


