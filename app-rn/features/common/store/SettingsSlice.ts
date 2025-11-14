import {StateCreator} from 'zustand';

export interface SettingsSlice {
  testMode: boolean;
  setTestMode: (testMode: boolean) => void;
}
export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  testMode: false,
  setTestMode: testMode => set({testMode}),
});
