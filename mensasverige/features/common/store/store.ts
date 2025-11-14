import {create} from 'zustand';
import {EventsSlice, createEventsSlice} from '../../events/store/EventsSlice';
import {
  LocationSlice,
  createLocationSlice,
} from '../../map/store/LocationSlice';
import {
  AccountSlice,
  createAccountSlice,
} from '../../account/store/AccountSlice';
import {SettingsSlice, createSettingsSlice} from './SettingsSlice';
import {
  NetworkStatusSlice,
  createNetworkStatusSlice,
} from './NetworkStatusSlice';

const useStore = create<
  EventsSlice &
    LocationSlice &
    AccountSlice &
    SettingsSlice &
    NetworkStatusSlice
>()((...a) => ({
  ...createEventsSlice(...a),
  ...createLocationSlice(...a),
  ...createAccountSlice(...a),
  ...createSettingsSlice(...a),
  ...createNetworkStatusSlice(...a),
}));
export default useStore;

