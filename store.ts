import {create} from 'zustand';
import {User} from './types/user';
import {Event} from './types/event';

interface State {
  config: {
    testMode: boolean;
  };
  user: User | null;
  userEvents: Event[];
  showUserEvents: boolean;
  staticEvents: Event[];
  showStaticEvents: boolean;
}

interface Actions {
  setUser: (user: User | null) => void;
  setUserEvents: (events: Event[]) => void;
  setShowUserEvents: (showUserEvents: boolean) => void;
  setStaticEvents: (events: Event[]) => void;
  setShowStaticEvents: (showStaticEvents: boolean) => void;
}

const useStore = create<State & Actions>(set => ({
  // Default state
  config: {
    testMode: false,
  },
  user: null,
  userEvents: [],
  showUserEvents: true,
  staticEvents: [],
  showStaticEvents: true,

  // Actions
  setUser: user => set({user}),
  setUserEvents: userEvents => set({userEvents}),
  setShowUserEvents: showUserEvents => set({showUserEvents}),
  setStaticEvents: staticEvents => set({staticEvents}),
  setShowStaticEvents: showStaticEvents => set({showStaticEvents}),
}));

export default useStore;
