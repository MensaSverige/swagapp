import { create } from 'zustand';
import { EventsSlice, createEventsSlice } from '../../events/store/EventsSlice';
import {
  LocationSlice,
  createLocationSlice,
} from '../../map/store/LocationSlice';
import {
  AccountSlice,
  createAccountSlice,
} from '../../account/store/AccountSlice';
import { SettingsSlice, createSettingsSlice } from './SettingsSlice';
import {
  NetworkStatusSlice,
  createNetworkStatusSlice,
} from './NetworkStatusSlice';
import { createUpdateSlice, UpdateSlice } from '@/features/updateCheck/store/UpdateSlice';

export type StoreState =
  AccountSlice &
  EventsSlice &
  LocationSlice &
  NetworkStatusSlice &
  SettingsSlice &
  UpdateSlice;

const useStore = create<StoreState>()((...a) => ({
  ...createAccountSlice(...a),
  ...createEventsSlice(...a),
  ...createLocationSlice(...a),
  ...createNetworkStatusSlice(...a),
  ...createSettingsSlice(...a),
  ...createUpdateSlice(...a),
}));
export default useStore;

