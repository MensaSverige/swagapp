import { useEffect, useCallback } from 'react';
import { GroupedEvents, ExtendedEvent } from '../types/eventUtilTypes';
import { createExtendedEvent } from '../utils/eventUtils';
import { fetchEvents, attendEvent, unattendEvent } from '../services/eventService';
import { getUsersByIds } from '../../account/services/userService';
import useStore from '../../common/store/store';
import { EventFilterOptions } from '../store/EventsSlice';

interface UseEventsOptions {
  enableAutoRefresh?: boolean;
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

  // loading: true only during the initial fetch (before first success)
  // refreshing: true during any active fetch (initial or manual pull-to-refresh)
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

// Module-level guard: prevents concurrent fetches across multiple useEvents instances
let isFetching = false;

// Module-level auto-refresh singleton: only one interval runs regardless of how many
// components call useEvents({ enableAutoRefresh: true })
let globalInterval: ReturnType<typeof setInterval> | null = null;
let intervalSubscribers = 0;

// Always points to the most recently rendered refetch, so the singleton interval
// never holds a stale closure when user or other dependencies change.
let latestRefetch: (() => Promise<void>) | null = null;

export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const {
    enableAutoRefresh = true
  } = options;

  const {
    // Raw events
    events,
    eventsRefreshing,
    eventsLastFetched,
    eventsInitialized,
    setEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    setEventsInitialized,

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
    user,
    getEventsRefreshInterval,
    setUsers,
  } = useStore();

  const refetch = useCallback(async (): Promise<void> => {
    if (isFetching) return;
    isFetching = true;
    try {
      setEventsRefreshing(true);
      setDashboardLoading(true);

      const allEvents = await fetchEvents();

      if (!Array.isArray(allEvents)) {
        throw new Error('Invalid events data received from API');
      }

      const processedEvents = allEvents
        .filter(event => event && event.id)
        .map(event => {
          try {
            return createExtendedEvent(event, user?.userId);
          } catch (error) {
            console.error('Error processing event:', event, error);
            return null;
          }
        })
        .filter(Boolean) as ExtendedEvent[];

      setEvents(processedEvents);
      setEventsLastFetched(new Date());
      setEventsInitialized(true);

      // Seed the current user's own profile synchronously so it's always available
      // in the cache (e.g. when they're the admin of a user-created event).
      if (user) {
        setUsers([user]);
      }

      // Pre-load user profiles for all event attendees/admins into the store cache.
      // Only fetch IDs not already cached to avoid redundant requests on every refresh.
      const allIds = new Set<number>();
      for (const event of processedEvents) {
        event.admin?.forEach((id) => allIds.add(id));
        event.attendees?.forEach((a) => allIds.add(a.userId));
      }
      console.log('[useEvents] attendee/admin IDs across all events:', [...allIds]);
      const cached = useStore.getState().usersById;
      const newIds = [...allIds].filter((id) => !cached[id]);
      console.log('[useEvents] already cached IDs:', Object.keys(cached).map(Number));
      console.log('[useEvents] new IDs to fetch:', newIds);
      if (newIds.length > 0) {
        getUsersByIds(newIds.map(String))
          .then((users) => {
            console.log('[useEvents] fetched users:', users.map((u) => u.userId));
            setUsers(users);
          })
          .catch((err) => {
            console.error('[useEvents] getUsersByIds failed:', err);
          });
      } else {
        console.log('[useEvents] no new IDs to fetch (all cached or empty)');
      }

    } catch (err) {
      const error = err as Error;
      setDashboardError(error);
      console.error('Error fetching events:', err);
    } finally {
      isFetching = false;
      setEventsRefreshing(false);
      setDashboardLoading(false);
    }
  }, [
    setEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    setEventsInitialized,
    setDashboardLoading,
    setDashboardError,
    user
  ]);

  // Keep the module-level pointer fresh so the singleton interval never uses a stale closure
  latestRefetch = refetch;

  // Reset initialized flag on logout so the next login triggers a fresh fetch
  useEffect(() => {
    if (!user) {
      setEventsInitialized(false);
    }
  }, [user, setEventsInitialized]);

  // Initial load: only fetch if not yet initialized and nothing is in flight
  useEffect(() => {
    if (!eventsInitialized) {
      refetch().catch(error => console.error('Error in initial loadEvents:', error));
    }
  }, [eventsInitialized, refetch]);

  // Auto-refresh singleton: multiple consumers share one interval
  useEffect(() => {
    if (!enableAutoRefresh) return;

    intervalSubscribers++;
    if (!globalInterval) {
      const ms = getEventsRefreshInterval();
      globalInterval = setInterval(() => {
        latestRefetch?.().catch(error => console.error('Auto-refresh failed:', error));
      }, ms);
    }

    return () => {
      intervalSubscribers--;
      if (intervalSubscribers === 0 && globalInterval) {
        clearInterval(globalInterval);
        globalInterval = null;
      }
    };
  }, [enableAutoRefresh, refetch, getEventsRefreshInterval]);

  // Event attendance functions
  const attendEventById = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        const updatedEvent = await attendEvent(eventId);
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

  return {
    allEvents: events,

    dashboardGroupedEvents,
    dashboardHasMoreEvents: dashboardHasMore,

    filteredGroupedEvents,
    filteredTotalCount,
    filteredCount,

    // loading is true only before the first successful fetch
    loading: !eventsInitialized && dashboardLoading,
    error: dashboardError,
    // refreshing is true during any active fetch
    refreshing: eventsRefreshing,
    lastFetched: eventsLastFetched,

    currentEventFilter,
    setCurrentEventFilter,
    resetFilters,

    categoryEventCounts,
    topCategories,
    lastMinuteEvents,

    refetch,
    addOrUpdateEvent,

    attendEventById,
    unattendEventById
  };
};
