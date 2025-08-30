import {StateCreator} from 'zustand';
import {User} from '../../../api_schema/types';

export interface AccountSlice {
  user: User | null;
  isTryingToLogin: boolean;
  setUser: (user: User | null) => void;
  setIsTryingToLogin: (isTryingToLogin: boolean) => void;
}
export const createAccountSlice: StateCreator<AccountSlice> = (set, get) => ({
  user: null,
  isTryingToLogin: false,
  setUser: user => set({user}),
  setIsTryingToLogin: isTryingToLogin => set({isTryingToLogin}),
});
