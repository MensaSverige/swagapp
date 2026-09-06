import { useEffect, useCallback, useMemo } from 'react';
import { GroupedEvents, ExtendedEvent } from '../types/eventUtilTypes';
import {
  createExtendedEvent,
  groupEventsByDate,
  filterByOptions,
  calcCategoryCounts,
  getTopCategories,
  selectDashboardEvents,
  selectLastMinuteEvents,
} from '../utils/eventUtils';
import { fetchEvents, attendEvent, unattendEvent, fetchInterestTags } from '../services/eventService';
import { getUsersByIds } from '../../account/services/userService';
import useStore from '../../common/store/store';
import { EventFilterOptions } from '../store/EventsSlice';

interface UseEventsOptions {
  enableAutoRefresh?: boolean;
}

interface UseEventsReturn {
  allEvents: ExtendedEvent[];
  dashboardGroupedEvents: GroupedEvents;
  dashboardHasMoreEvents: boolean;

  filteredGroupedEvents: GroupedEvents;
  filteredTotalCount: number;
  filteredCount: number;

  loading: boolean;
  error: Error | null;
  refreshing: boolean;
  lastFetched: Date | null;

  currentEventFilter: EventFilterOptions;
  setCurrentEventFilter: (filter: EventFilterOptions) => void;
  resetFilters: () => void;

  categoryEventCounts: Record<string, number>;
  topCategories: string[];
  lastMinuteEvents: ExtendedEvent[];

  refetch: () => Promise<void>;
  addOrUpdateEvent: (event: ExtendedEvent) => void;

  attendEventById: (eventId: string) => Promise<boolean>;
  unattendEventById: (eventId: string) => Promise<boolean>;
}

const USER_PREFETCH_CHUNK_SIZE = 8;

let isFetching = false;
let globalInterval: ReturnType<typeof setInterval> | null = null;
let intervalSubscribers = 0;
let latestRefetch: (() => Promise<void>) | null = null;

const DASHBOARD_MAX = 3;
const LAST_MINUTE_HOURS = 2;

export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const { enableAutoRefresh = true } = options;

  const {
    events,
    eventsRefreshing,
    eventsError,
    eventsLastFetched,
    eventsInitialized,
    setEvents,
    setEventsRefreshing,
    setEventsError,
    setEventsLastFetched,
    setEventsInitialized,
    setInterestTags,
    currentEventFilter,
    setCurrentEventFilter,
    resetFilters,
    addOrUpdateEvent,
    user,
    getEventsRefreshInterval,
    setUsers,
  } = useStore();

  // ── Derivations (all pure, run only when events / filter change) ──────────

  const dashboardEvents = useMemo(() => selectDashboardEvents(events), [events]);

  const dashboardGroupedEvents = useMemo(
    () => groupEventsByDate(dashboardEvents.slice(0, DASHBOARD_MAX)),
    [dashboardEvents]
  );

  const dashboardHasMore = useMemo(
    () => dashboardEvents.length > DASHBOARD_MAX,
    [dashboardEvents]
  );

  // Reads the clock on each recomputation. A `now` frozen at first render
  // drifts against the cutoff, widening the window for the whole session.
  const lastMinuteEvents = useMemo(
    () => selectLastMinuteEvents(events, LAST_MINUTE_HOURS),
    [events]
  );

  const categoryEventCounts = useMemo(() => calcCategoryCounts(events), [events]);

  const topCategories = useMemo(
    () => getTopCategories(categoryEventCounts),
    [categoryEventCounts]
  );

  const filteredEvents = useMemo(
    () => filterByOptions(events, currentEventFilter),
    [events, currentEventFilter]
  );

  const filteredGroupedEvents = useMemo(
    () => groupEventsByDate(filteredEvents),
    [filteredEvents]
  );

  const filteredTotalCount = useMemo(() => {
    // "total" = all non-past events (no additional filter)
    const fromDate = new Date();
    return events.filter(e => {
      if (!e.start) return false;
      const start = new Date(e.start);
      if (e.end) {
        const end = new Date(e.end);
        if (start <= fromDate && end >= fromDate) return true;
      }
      return start >= fromDate;
    }).length;
  }, [events]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const refetch = useCallback(async (): Promise<void> => {
    if (isFetching) return;
    isFetching = true;
    try {
      setEventsRefreshing(true);

      const allEvents = await fetchEvents();

      if (!Array.isArray(allEvents)) {
        throw new Error('Invalid events data received from API');
      }

      const processedEvents = allEvents
        .filter(event => event && event.id)
        .map(event => {
          try {
            return createExtendedEvent(event, user?.userId);
          } catch (err) {
            console.error('Error processing event:', event, err);
            return null;
          }
        })
        .filter(Boolean) as ExtendedEvent[];

      setEvents(processedEvents);
      setEventsLastFetched(new Date());
      setEventsInitialized(true);
      setEventsError(null);

      if (user) setUsers([user]);

      const allIds = new Set<number>();
      for (const event of processedEvents) {
        event.admin?.forEach(id => allIds.add(id));
        event.attendees?.forEach(a => allIds.add(a.userId));
      }

      if (allIds.size > 0) {
        setTimeout(() => {
          const newIds = [...allIds].filter(id => !useStore.getState().usersById[id]);
          if (newIds.length === 0) return;
          (async () => {
            for (let i = 0; i < newIds.length; i += USER_PREFETCH_CHUNK_SIZE) {
              const chunk = newIds.slice(i, i + USER_PREFETCH_CHUNK_SIZE);
              try {
                const users = await getUsersByIds(chunk.map(String));
                setUsers(users);
              } catch (err) {
                console.error('[useEvents] getUsersByIds chunk failed:', err);
              }
            }
          })().catch(err => console.error('[useEvents] user prefetch failed:', err));
        }, 0);
      }
    } catch (err) {
      setEventsError(err as Error);
      console.error('Error fetching events:', err);
    } finally {
      isFetching = false;
      setEventsRefreshing(false);
    }
  }, [setEvents, setEventsRefreshing, setEventsError, setEventsLastFetched, setEventsInitialized, user]);

  latestRefetch = refetch;

  useEffect(() => {
    if (!user) setEventsInitialized(false);
  }, [user, setEventsInitialized]);

  useEffect(() => {
    if (!eventsInitialized) {
      refetch().catch(err => console.error('Error in initial loadEvents:', err));
    }
  }, [eventsInitialized, refetch]);

  useEffect(() => {
    fetchInterestTags().then(tags => {
      if (tags.length > 0) setInterestTags(tags);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enableAutoRefresh) return;
    intervalSubscribers++;
    if (!globalInterval) {
      const ms = getEventsRefreshInterval();
      globalInterval = setInterval(() => {
        latestRefetch?.().catch(err => console.error('Auto-refresh failed:', err));
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

  // ── Attendance actions ────────────────────────────────────────────────────

  const attendEventById = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        const updated = await attendEvent(eventId);
        addOrUpdateEvent(createExtendedEvent(updated, user?.userId));
        return true;
      } catch (err) {
        console.error('Error attending event:', err);
        throw err;
      }
    },
    [addOrUpdateEvent, user?.userId]
  );

  const unattendEventById = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        await unattendEvent(eventId);
        const existing = events.find(e => e.id === eventId);
        if (existing) {
          addOrUpdateEvent(createExtendedEvent({ ...existing, attending: false }, user?.userId));
        }
        return true;
      } catch (err) {
        console.error('Error unattending event:', err);
        throw err;
      }
    },
    [events, addOrUpdateEvent, user?.userId]
  );

  return {
    allEvents: events,
    dashboardGroupedEvents,
    dashboardHasMoreEvents: dashboardHasMore,
    filteredGroupedEvents,
    filteredTotalCount,
    filteredCount: filteredEvents.length,
    // Both come from the store: with the module-level isFetching guard, only
    // the first caller runs a fetch, so per-instance state would leave the
    // second consumer rendering an empty list instead of a spinner.
    loading: !eventsInitialized && eventsRefreshing,
    error: eventsError,
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
    unattendEventById,
  };
};
