import {create} from 'zustand';
import {User} from './types/user';

const useStore = create<{
  config: {
    testMode: boolean;
  };
  user: User | null;
  setUser: (user: User | null) => void;
}>(set => ({
  config: {
    testMode: false,
  },
  user: null,
  token: null,
  setUser: user => set({user}),
}));

export default useStore;
