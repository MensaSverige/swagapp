import { useEffect, useCallback } from 'react';
import { Event } from '../../../api_schema/types';
import { 
    getUpcomingAttendingEvents, 
    findNextEvent,
    GroupedEvents
} from '../utils/eventUtils';
import { fetchEvents } from '../services/eventService';
import useStore from '../../common/store/store';

interface UseDashboardEventsReturn {
  groupedEvents: GroupedEvents;
  nextEvent: Event | null;
  hasMoreEvents?: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for dashboard events - uses Zustand store for state management
 * This ensures the dashboard events list is maintained globally across navigation
 */
export const useDashboardEventsIndependent = (limit: number = 3): UseDashboardEventsReturn => {
  const {
    dashboardEvents,
    dashboardGroupedEvents: groupedEvents,
    dashboardHasMore: hasMoreEvents,
    dashboardNextEvent: nextEvent,
    dashboardLoading: loading,
    dashboardError: error,
    setDashboardEvents,
    setDashboardGroupedEvents,
    setDashboardHasMore,
    setDashboardNextEvent,
    setDashboardLoading,
    setDashboardError
  } = useStore();

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
      
      setDashboardGroupedEvents(result.groupedEvents);
      setDashboardHasMore(result.hasMore);

      // Find next event
      const nextEventFound = findNextEvent(result.groupedEvents, true);
      setDashboardNextEvent(nextEventFound);

      setDashboardError(null);
    } catch (err) {
      setDashboardError(err as Error);
      console.error('Error processing dashboard events:', err);
    }
  }, [limit, setDashboardGroupedEvents, setDashboardHasMore, setDashboardNextEvent, setDashboardError]);

  const fetchDashboardEvents = useCallback(async () => {
    try {
      setDashboardLoading(true);
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
      setDashboardError(err as Error);
      console.error('Error fetching dashboard events:', err);
    } finally {
      setDashboardLoading(false);
    }
  }, [processEventsData, setDashboardLoading, setDashboardEvents, setDashboardError]);

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