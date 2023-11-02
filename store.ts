import {create} from 'zustand';
import {User} from './types/user';

const useStore = create<{
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}>(set => ({
  user: null,
  token: null,
  setToken: token => set({token}),
  setUser: user => set({user}),
}));

export default useStore;
