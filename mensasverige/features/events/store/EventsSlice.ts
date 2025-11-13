import {StateCreator} from 'zustand';
import { Event } from '../../../api_schema/types';
import { GroupedEvents } from '../utils/eventUtils';

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
}

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

  setEvents: (events: Event[]) => {
    set(() => ({events: events}));
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
});
