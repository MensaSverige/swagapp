import {StateCreator} from 'zustand';
import {User} from '../../../api_schema/types';
import { DEFAULT_SETTINGS } from '@/constants/DefaultSettings';

export interface AccountSlice {
  user: User | null;
  isTryingToLogin: boolean;
  setUser: (user: User | null) => void;
  setIsTryingToLogin: (isTryingToLogin: boolean) => void;
  getLocationUpdateInterval: () => number;
  getEventsRefreshInterval: () => number;
}
export const createAccountSlice: StateCreator<AccountSlice> = (set, get) => ({
  user: null,
  isTryingToLogin: false,
  setUser: user => set({user}),
  setIsTryingToLogin: isTryingToLogin => set({isTryingToLogin}),
  getLocationUpdateInterval: () => {
    const { user } = get();
    return (user?.settings?.location_update_interval_seconds ?? DEFAULT_SETTINGS.LOCATION_UPDATE_INTERVAL_SECONDS) * 1000;
  },
  getEventsRefreshInterval: () => {
    const { user } = get();
    return (user?.settings?.events_refresh_interval_seconds ?? DEFAULT_SETTINGS.EVENTS_REFRESH_INTERVAL_SECONDS) * 1000;
  },
});
