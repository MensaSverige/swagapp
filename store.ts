import {create} from 'zustand';
import {User} from './types/user';
import {Event} from './types/event';

interface State {
  config: {
    testMode: boolean;
    locationUpdateInterval: number;
  };
  user: User | null;
  visibleEvents: Event[];
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
  setUserLocation: (latitude: number, longitude: number) => void;
  setShowUserEvents: (showUserEvents: boolean) => void;
  setStaticEvents: (events: Event[]) => void;
  setShowStaticEvents: (showStaticEvents: boolean) => void;
  setEventsRefreshing: (eventsRefreshing: boolean) => void;
  setEventsLastFetched: (eventsLastFetched: Date | null) => void;
  updateVisibleEvents: () => void;
}

const useStore = create<State & Actions>(set => ({
  // Default state
  config: {
    testMode: false,
    locationUpdateInterval: 60000,
  },
  user: null,
  visibleEvents: [],
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
  },
  setUserLocation(latitude, longitude) {
    const {user} = useStore.getState();
    if (user) {
      user.location = {
        latitude,
        longitude,
      };
      set({user});
    }
  },
  setShowUserEvents: showUserEvents => {
    set({showUserEvents});
    useStore.getState().updateVisibleEvents();
  },
  setStaticEvents: staticEvents => {
    set({staticEvents});
    useStore.getState().updateVisibleEvents();
  },
  setShowStaticEvents: showStaticEvents => {
    set({showStaticEvents});
    useStore.getState().updateVisibleEvents();
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
}));

export default useStore;
