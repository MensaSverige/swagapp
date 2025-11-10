import { useState, useEffect, useCallback } from 'react';
import { Event } from '../../../api_schema/types';
import { 
    getUpcomingAttendingEvents, 
    findNextEvent,
    GroupedEvents
} from '../utils/eventUtils';
import { fetchEvents } from '../services/eventService';

interface UseDashboardEventsReturn {
  groupedEvents: GroupedEvents;
  nextEvent: Event | null;
  hasMoreEvents?: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for dashboard events - independent local state that fetches its own data
 * This ensures the dashboard events list doesn't get affected by navigation to other screens
 */
export const useDashboardEventsIndependent = (limit: number = 3): UseDashboardEventsReturn => {
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [hasMoreEvents, setHasMoreEvents] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dashboardEvents, setDashboardEvents] = useState<Event[]>([]);

  const processEventsData = useCallback((eventsData: Event[]) => {
    try {
      console.log('Dashboard processing events:', {
        totalEvents: eventsData.length,
        sampleEvents: eventsData.slice(0, 3).map(e => ({ 
          id: e.id, 
          name: e.name, 
          attending: e.attending, 
          start: e.start 
        }))
      });
      
      // Get upcoming attending events with limit for dashboard
      const result = getUpcomingAttendingEvents(eventsData, limit);
      
      console.log('Dashboard processed result:', {
        groupedEventsKeys: Object.keys(result.groupedEvents),
        totalEventsInResult: Object.values(result.groupedEvents).flat().length,
        hasMore: result.hasMore
      });
      
      setGroupedEvents(result.groupedEvents);
      setHasMoreEvents(result.hasMore);

      // Find next event
      const nextEventFound = findNextEvent(result.groupedEvents, true);
      setNextEvent(nextEventFound);

      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error processing dashboard events:', err);
    }
  }, [limit]);

  const fetchDashboardEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching events for dashboard...');
      
      // Fetch events that the user is attending
      const fetchedEvents = await fetchEvents({ attending: true });
      
      console.log('Fetched dashboard events:', {
        totalEvents: fetchedEvents.length,
        sampleEvents: fetchedEvents.slice(0, 3).map(e => ({ 
          id: e.id, 
          name: e.name, 
          attending: e.attending, 
          start: e.start 
        }))
      });
      
      setDashboardEvents(fetchedEvents);
      processEventsData(fetchedEvents);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching dashboard events:', err);
    } finally {
      setLoading(false);
    }
  }, [processEventsData]);

  const refetch = useCallback(() => {
    fetchDashboardEvents();
  }, [fetchDashboardEvents]);

  // Initial load
  useEffect(() => {
    fetchDashboardEvents();
  }, [fetchDashboardEvents]);

  return {
    groupedEvents,
    nextEvent,
    hasMoreEvents,
    loading,
    error,
    refetch
  };
};