import {create} from 'zustand';
import {User} from './types/user';

const useStore = create<{
  config: {
    apiUrl: string;
    testMode: string;
  };
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}>(set => ({
  config: {
    apiUrl: 'http://192.168.0.11:5000',
    testMode: 'false',
  },
  user: null,
  token: null,
  setToken: token => set({token}),
  setUser: user => set({user}),
}));

export default useStore;