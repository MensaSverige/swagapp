import {create} from 'zustand';
import {User} from '../types/user';
import {Event} from '../types/event';
import {LocationState, createLocationSlice} from './LocationState';
import EventWithLocation, {
  isEventWithLocation,
} from '../types/eventWithLocation';

interface State {
  config: {
    testMode: boolean;
  };
  user: User | null;
  visibleEvents: Event[];
  eventsWithLocation: EventWithLocation[];
  userEvents: Event[];
  showUserEvents: boolean;
  staticEvents: Event[];
  showStaticEvents: boolean;
  eventsRefreshing: boolean;
  eventsLastFetched: Date | null;
}
interface Actions {
  setUser: (user: User | null) => void;
  setUserEvents: (events: Event[]) => void;
  setShowUserEvents: (showUserEvents: boolean) => void;
  setStaticEvents: (events: Event[]) => void;
  setShowStaticEvents: (showStaticEvents: boolean) => void;
  setEventsRefreshing: (eventsRefreshing: boolean) => void;
  setEventsLastFetched: (eventsLastFetched: Date | null) => void;
  updateVisibleEvents: () => void;
  updateEventsWithLocation: () => void;
}

export const useStore = create<State & Actions & LocationState>(set => ({
  ...createLocationSlice(set),
  // Default state
  config: {
    testMode: false,
  },
  user: null,
  visibleEvents: [],
  eventsWithLocation: [],
  userEvents: [],
  showUserEvents: true,
  staticEvents: [],
  showStaticEvents: true,
  eventsRefreshing: false,
  eventsLastFetched: null,

  // Actions
  setUser: user => set({user}),

  setUserEvents: userEvents => {
    set({userEvents});
    useStore.getState().updateVisibleEvents();
    useStore.getState().updateEventsWithLocation();
  },
  setShowUserEvents: showUserEvents => {
    set({showUserEvents});
    useStore.getState().updateVisibleEvents();
    useStore.getState().updateEventsWithLocation();
  },
  setStaticEvents: staticEvents => {
    set({staticEvents});
    useStore.getState().updateVisibleEvents();
    useStore.getState().updateEventsWithLocation();
  },
  setShowStaticEvents: showStaticEvents => {
    set({showStaticEvents});
    useStore.getState().updateVisibleEvents();
    useStore.getState().updateEventsWithLocation();
  },
  setEventsRefreshing: eventsRefreshing => set({eventsRefreshing}),
  setEventsLastFetched: eventsLastFetched => set({eventsLastFetched}),
  updateVisibleEvents: () => {
    const {showUserEvents, showStaticEvents, userEvents, staticEvents} =
      useStore.getState();
    const newVisibleEvents = [
      ...(showUserEvents ? userEvents : []),
      ...(showStaticEvents ? staticEvents : []),
    ];
    set({visibleEvents: newVisibleEvents});
  },
  updateEventsWithLocation: () => {
    const {userEvents, staticEvents} = useStore.getState();
    const newEventsWithLocation = userEvents
      .concat(staticEvents)
      .filter(isEventWithLocation);
    set({eventsWithLocation: newEventsWithLocation});
  },
}));

export default useStore;

export const useLocationState = () => {
  return useStore(state => ({
    currentLocation: state.currentLocation,
    showlocation: state.showlocation,
    region: state.region,
    locationUpdateInterval: state.locationUpdateInterval,
    setRegion: state.setRegion,
    setUserLocation: state.setUserLocation,
  }));
};
