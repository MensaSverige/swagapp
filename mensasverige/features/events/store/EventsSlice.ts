import {StateCreator} from 'zustand';
import { Event } from '../../../api_schema/types';

export interface EventsSlice {
  events: Event[];
  eventsRefreshing: boolean;
  eventsLastFetched: Date | null;

  setEvents: (events: Event[]) => void;
  setEventsRefreshing: (eventsRefreshing: boolean) => void;
  setEventsLastFetched: (eventsLastFetched: Date | null) => void;
}

export const createEventsSlice: StateCreator<EventsSlice> = (set, get) => ({
  events: [],
  eventsRefreshing: false,
  eventsLastFetched: null,

  setEvents: (events: Event[]) => {
    set(() => ({events: events}));
  },
  setEventsRefreshing: (eventsRefreshing: boolean) => set({eventsRefreshing}),
  setEventsLastFetched: (eventsLastFetched: Date | null) =>
    set({eventsLastFetched}),
});
