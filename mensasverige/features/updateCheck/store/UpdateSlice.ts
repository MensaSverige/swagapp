import { StoreState } from '@/features/common/store/store';
import { StateCreator } from 'zustand';

export type UpdateInfo = {
    updateRequired?: boolean | undefined;
    updateAvailable?: boolean | undefined;
    latestVersion?: string | null | undefined;
    latestBuildNumber?: number | null | undefined;
    storeUrl?: string | null | undefined;
}

export interface UpdateSlice {
  updateAvailableInfo: UpdateInfo | null;
  requiredUpdateInfo: UpdateInfo | null;
  setUpdateAvailableInfo: (info: UpdateInfo | null) => void;
  setRequiredUpdateInfo: (info: UpdateInfo | null) => void;
}

export const createUpdateSlice: StateCreator<StoreState, [], [], UpdateSlice> = (set) => ({
  updateAvailableInfo: null,
  requiredUpdateInfo: null,
  setUpdateAvailableInfo: (info) => set({ updateAvailableInfo: info }),
  setRequiredUpdateInfo: (info) => set({ requiredUpdateInfo: info }),
});
