// Manual mock for expo-secure-store — replaced by secureStorage.ts abstraction in prod;
// this mock lets Jest unit tests control what's "in storage" without native modules.
const store: Record<string, string | null> = {};

export const getItemAsync = jest.fn(async (key: string) => store[key] ?? null);
export const setItemAsync = jest.fn(async (key: string, value: string) => { store[key] = value; });
export const deleteItemAsync = jest.fn(async (key: string) => { delete store[key]; });

export const __reset = () => {
  Object.keys(store).forEach(k => delete store[k]);
  getItemAsync.mockClear();
  setItemAsync.mockClear();
  deleteItemAsync.mockClear();
};
