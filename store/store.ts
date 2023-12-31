import {create} from 'zustand';
import {EventsSlice, createEventsSlice} from './EventsSlice';
import {LocationSlice, createLocationSlice} from './LocationSlice';
import {UserSlice, createUserSlice} from './UserSlice';
import {SettingsSlice, createSettingsSlice} from './SettingsSlice';

const useStore = create<EventsSlice & LocationSlice & UserSlice & SettingsSlice>()((...a) => ({
  ...createEventsSlice(...a),
  ...createLocationSlice(...a),
  ...createUserSlice(...a),
  ...createSettingsSlice(...a),
}))
export default useStore;

// optional to use slices in components. All slices and their methods are available in useStore
export function useUserSlice(): UserSlice {
  return useStore(state => ({
    user: state.user,
    isTryingToLogin: state.isTryingToLogin,
    setUser: state.setUser,
    setIsTryingToLogin: state.setIsTryingToLogin,
  }));
}
