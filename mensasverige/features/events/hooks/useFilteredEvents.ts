import { useState, useEffect, useMemo } from 'react';
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
import { EventFilterOptions } from '../components/EventFilter';

interface UseFilteredEventsOptions {
  filter?: EventFilter;
  eventFilter?: EventFilterOptions;
  enableAutoRefresh?: boolean;
  refreshIntervalMs?: number;
}

interface UseFilteredEventsReturn {
  groupedEvents: GroupedEvents;
  nextEvent: Event | null;
  hasMoreEvents?: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  totalEventsCount: number;
  filteredEventsCount: number;
}

/**
 * Custom hook for managing event data with API and client-side filtering
 */
export const useFilteredEvents = (options: UseFilteredEventsOptions = {}): UseFilteredEventsReturn => {
  const { 
    filter, 
    eventFilter,
    enableAutoRefresh = false, 
    refreshIntervalMs = 60000 
  } = options;
  
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [hasMoreEvents, setHasMoreEvents] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  
  const { events, setEvents } = useStore();

  // Create API filter params from EventFilterOptions
  const apiFilterParams = useMemo(() => {
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
  }, [eventFilter]);

  // Apply client-side category filtering
  const applyClientSideFilters = (eventsData: Event[]): Event[] => {
    if (!eventFilter?.categories || eventFilter.categories.length === 0) {
      return eventsData;
    }
    
    return eventsData.filter(event => {
      if (!event.tags || event.tags.length === 0) {
        return false;
      }
      
      return event.tags.some(tag => eventFilter.categories!.includes(tag.code));
    });
  };

  const processEventsData = (eventsData: Event[]) => {
    try {
      // First apply client-side filtering
      const clientFilteredEvents = applyClientSideFilters(eventsData);
      
      let processedGroupedEvents: GroupedEvents;
      let hasMore: boolean | undefined = undefined;

      if (filter) {
        // Apply custom filtering if provided
        if (filter.attending !== undefined && filter.upcoming && filter.limit) {
          // Dashboard use case - get upcoming attending events with limit
          const result = getUpcomingAttendingEvents(clientFilteredEvents, filter.limit);
          processedGroupedEvents = result.groupedEvents;
          hasMore = result.hasMore;
        } else {
          // Custom filtering - process with provided filter
          processedGroupedEvents = getAllEventsGrouped(clientFilteredEvents);
          // TODO: Apply other custom filters if needed
        }
      } else {
        // No filter - get all events grouped (schedule view)
        processedGroupedEvents = getAllEventsGrouped(clientFilteredEvents);
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
  };

  const refetch = async (): Promise<void> => {
    try {
      setLoading(true);
      const fetchedEvents = await fetchEvents(apiFilterParams);
      setEvents(fetchedEvents); // Update store
      setAllEvents(fetchedEvents);
      processEventsData(fetchedEvents);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when API filter parameters change
  useEffect(() => {
    refetch();
  }, [JSON.stringify(apiFilterParams)]);

  // Reprocess events when client-side filters change
  useEffect(() => {
    if (allEvents.length > 0) {
      processEventsData(allEvents);
    }
  }, [eventFilter?.categories, JSON.stringify(filter)]);

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

  // Calculate counts
  const totalEventsCount = allEvents.length;
  const filteredEventsCount = useMemo(() => {
    return Object.values(groupedEvents).flat().length;
  }, [groupedEvents]);

  return {
    groupedEvents,
    nextEvent,
    hasMoreEvents,
    loading,
    error,
    refetch,
    totalEventsCount,
    filteredEventsCount
  };
};

/**
 * Hook specifically for dashboard events (upcoming + attending)
 */
export const useDashboardEvents = (limit: number = 3) => {
  return useFilteredEvents({
    filter: { attending: true, upcoming: true, limit },
    enableAutoRefresh: false
  });
};

/**
 * Hook for schedule view (all events with next event tracking and filtering)
 */
export const useScheduleEventsWithFilter = (eventFilter?: EventFilterOptions) => {
  return useFilteredEvents({
    eventFilter,
    enableAutoRefresh: true,
    refreshIntervalMs: 60000
  });
};