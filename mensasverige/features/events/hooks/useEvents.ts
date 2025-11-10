import { useState, useEffect, useCallback } from 'react';
import { Event } from '../../../api_schema/types';
import { 
    getAllEventsGrouped, 
    getUpcomingAttendingEvents, 
    findNextEvent,
    GroupedEvents,
    EventFilter 
} from '../utils/eventUtils';
import { fetchEvents } from '../services/eventService';
import useStore from '../../common/store/store';

interface UseEventsOptions {
  filter?: EventFilter;
  enableAutoRefresh?: boolean;
  refreshIntervalMs?: number;
}

interface UseEventsReturn {
  groupedEvents: GroupedEvents;
  nextEvent: Event | null;
  hasMoreEvents?: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing event data with filtering, grouping, and auto-refresh
 */
export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const { 
    filter, 
    enableAutoRefresh = false, 
    refreshIntervalMs = 60000 
  } = options;
  
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [hasMoreEvents, setHasMoreEvents] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { events, setEvents } = useStore();

  const processEventsData = useCallback((eventsData: Event[]) => {
    try {
      let processedGroupedEvents: GroupedEvents;
      let hasMore: boolean | undefined = undefined;

      if (filter) {
        // Apply custom filtering if provided
        if (filter.attending !== undefined && filter.upcoming && filter.limit) {
          // Dashboard use case - get upcoming attending events with limit
          const result = getUpcomingAttendingEvents(eventsData, filter.limit);
          processedGroupedEvents = result.groupedEvents;
          hasMore = result.hasMore;
        } else {
          // Custom filtering - process with provided filter
          processedGroupedEvents = getAllEventsGrouped(eventsData);
          // TODO: Apply other custom filters if needed
        }
      } else {
        // No filter - get all events grouped (schedule view)
        processedGroupedEvents = getAllEventsGrouped(eventsData);
      }

      setGroupedEvents(processedGroupedEvents);
      setHasMoreEvents(hasMore);

      // Find next event
      const nextEventFound = findNextEvent(processedGroupedEvents, true);
      setNextEvent(nextEventFound);

      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error processing events:', err);
    }
  }, [filter]);

  const refetch = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents); // Update store
      processEventsData(fetchedEvents);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [setEvents, processEventsData]);

  // Initial load
  useEffect(() => {
    const loadEvents = async () => {
      // Use events from store if available, otherwise fetch
      if (events && events.length > 0) {
        processEventsData(events);
        setLoading(false);
      } else {
        await refetch();
      }
    };

    loadEvents();
  }, [events]);

  // Auto-refresh next event detection
  useEffect(() => {
    if (!enableAutoRefresh || Object.keys(groupedEvents).length === 0) return;

    const updateNextEvent = () => {
      const nextEventFound = findNextEvent(groupedEvents, true);
      setNextEvent(nextEventFound);
    };

    const intervalId = setInterval(updateNextEvent, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [groupedEvents, enableAutoRefresh, refreshIntervalMs]);

  return {
    groupedEvents,
    nextEvent,
    hasMoreEvents,
    loading,
    error,
    refetch
  };
};

/**
 * Hook specifically for dashboard events (upcoming + attending)
 */
export const useDashboardEvents = (limit: number = 3) => {
  return useEvents({
    filter: { attending: true, upcoming: true, limit },
    enableAutoRefresh: false
  });
};

/**
 * Hook for schedule view (all events with next event tracking)
 */
export const useScheduleEvents = () => {
  return useEvents({
    enableAutoRefresh: true,
    refreshIntervalMs: 60000
  });
};