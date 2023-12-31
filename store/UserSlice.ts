import {StateCreator} from 'zustand';
import {User} from '../types/user';

export interface UserSlice {
  user: User | null;
  isTryingToLogin: boolean;
  setUser: (user: User | null) => void;
  setIsTryingToLogin: (isTryingToLogin: boolean) => void;
}
export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  user: null,
  isTryingToLogin: false,
  setUser: user => set({user}),
  setIsTryingToLogin: isTryingToLogin => set({isTryingToLogin}),
});
