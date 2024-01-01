import {create} from 'zustand';
import {EventsSlice, createEventsSlice} from '../../events/store/EventsSlice';
import {LocationSlice, createLocationSlice} from '../../map/store/LocationSlice';
import {AccountSlice, createAccountSlice} from '../../account/store/AccountSlice';
import {SettingsSlice, createSettingsSlice} from './SettingsSlice';

const useStore = create<EventsSlice & LocationSlice & AccountSlice & SettingsSlice>()((...a) => ({
  ...createEventsSlice(...a),
  ...createLocationSlice(...a),
  ...createAccountSlice(...a),
  ...createSettingsSlice(...a),
}))
export default useStore;

// optional to use slices in components. All slices and their methods are available in useStore
export function useUserSlice(): AccountSlice {
  return useStore(state => ({
    user: state.user,
    isTryingToLogin: state.isTryingToLogin,
    setUser: state.setUser,
    setIsTryingToLogin: state.setIsTryingToLogin,
  }));
}
