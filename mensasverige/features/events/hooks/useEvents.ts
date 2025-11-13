import { useEffect, useCallback } from 'react';
import { GroupedEvents, ExtendedEvent } from '../types/eventUtilTypes';
import { createExtendedEvent } from '../utils/eventUtils';
import { fetchEvents, attendEvent, unattendEvent } from '../services/eventService';
import useStore from '../../common/store/store';
import { EventFilterOptions } from '../store/EventsSlice';

interface UseEventsOptions {
  enableAutoRefresh?: boolean;
  refreshIntervalMs?: number;
}

interface UseEventsReturn {
  // All events data (extended events only)
  allEvents: ExtendedEvent[];
  // Dashboard events (attending + upcoming with limit)
  dashboardGroupedEvents: GroupedEvents;
  dashboardHasMoreEvents: boolean;

  // Filtered events (based on current filters in store)
  filteredGroupedEvents: GroupedEvents;
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
  lastMinuteEvents: ExtendedEvent[];

  // Actions
  refetch: () => Promise<void>;
  addOrUpdateEvent: (event: ExtendedEvent) => void;

  // Event attendance actions
  attendEventById: (eventId: string) => Promise<boolean>;
  unattendEventById: (eventId: string) => Promise<boolean>;
}

export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const {
    enableAutoRefresh = true,
    refreshIntervalMs = 60000
  } = options;

  const {
    // Raw events
    events,
    eventsRefreshing,
    eventsLastFetched,
    setEvents,
    setEventsRefreshing,
    setEventsLastFetched,

    // Dashboard events (attending + upcoming with limit)
    dashboardGroupedEvents,
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
    filteredTotalCount,
    filteredCount,

    // Event management actions
    addOrUpdateEvent,

    // Derived analytics
    categoryEventCounts,
    topCategories,
    lastMinuteEvents,
    user
  } = useStore();

  // Refetch function that updates both schedule and dashboard
  const refetch = useCallback(async (): Promise<void> => {
    try {
      setEventsRefreshing(true);
      setDashboardLoading(true);

      // Fetch all events - the store will automatically update derived lists
      const allEvents = await fetchEvents();

      // Setting events in store will automatically update both schedule and dashboard
      setEvents(allEvents.map(event => createExtendedEvent(event, user?.userId)));
      setEventsLastFetched(new Date());

    } catch (err) {
      const error = err as Error;
      setDashboardError(error);
      console.error('Error fetching events:', err);
    } finally {
      setEventsRefreshing(false);
      setDashboardLoading(false);
    }
  }, [
    setEvents,
    setEventsRefreshing,
    setEventsLastFetched,
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
    if (!enableAutoRefresh) return;

    const intervalId = setInterval(() => {
      refetch();
    }, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [enableAutoRefresh, refreshIntervalMs, refetch]);

  // Event attendance functions
  const attendEventById = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        const updatedEvent = await attendEvent(eventId);
        // Update the event in the store with the returned data
        const updatedEvents = events.map(event =>
          event.id === eventId ? createExtendedEvent(updatedEvent, user?.userId) : event
        );
        setEvents(updatedEvents);
        return true;
      } catch (error) {
        console.error('Error attending event:', error);
        throw error;
      }
    },
    [events, setEvents, user?.userId]
  );

  const unattendEventById = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        await unattendEvent(eventId);
        // Update the event in the store to set attending to false
        const updatedEvents = events.map(event =>
          event.id === eventId
            ? createExtendedEvent({ ...event, attending: false }, user?.userId)
            : event
        );
        setEvents(updatedEvents);
        return true;
      } catch (error) {
        console.error('Error unattending event:', error);
        throw error;
      }
    },
    [events, setEvents, user?.userId]
  );

  // Determine overall loading and error states
  const isLoading = dashboardLoading;
  const hasError = dashboardError;

  return {
    // All events data
    allEvents: events,

    // Dashboard events (attending + upcoming with limit)
    dashboardGroupedEvents,
    dashboardHasMoreEvents: dashboardHasMore,

    // Filtered events (based on current filters in store)
    filteredGroupedEvents,
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

    // Actions
    refetch,
    addOrUpdateEvent,

    // Event attendance actions
    attendEventById,
    unattendEventById
  };
};


