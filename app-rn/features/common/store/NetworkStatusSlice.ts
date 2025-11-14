import {StateCreator} from 'zustand';

export interface NetworkStatusSlice {
  backendConnection: boolean;
  setBackendConnection: (backendConnection: boolean) => void;
}
export const createNetworkStatusSlice: StateCreator<
  NetworkStatusSlice
> = set => ({
  backendConnection: true,
  setBackendConnection: (backendConnection) => (state: NetworkStatusSlice) => {
    if (state.backendConnection !== backendConnection) {
      state.backendConnection = backendConnection;
    }
  },
});
