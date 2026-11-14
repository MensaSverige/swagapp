import { useCallback, useEffect, useMemo } from 'react';
import useStore from '../../common/store/store';
import { getItem, setItem } from '../../common/services/secureStorage';
import { ExtendedEvent } from '../types/eventUtilTypes';
import {
  LocalEventFilter,
  Position,
  applyLocalEventFilter,
  knownPosition,
  parseLocalEventFilter,
} from '../utils/localEventFilter';
import { useLocalEvents } from './useMainEvents';

const STORAGE_KEY = 'localEventFilter';
let loadStarted = false;

/**
 * The local event filter, loaded once from the device and saved on every
 * change, so a member picks their local group once and not every app start.
 */
export const useLocalEventFilter = (): [LocalEventFilter, (filter: LocalEventFilter) => void] => {
  const filter = useStore(s => s.localEventFilter);
  const setInStore = useStore(s => s.setLocalEventFilter);

  useEffect(() => {
    if (loadStarted) return;
    loadStarted = true;
    getItem(STORAGE_KEY)
      .then(raw => {
        const saved = parseLocalEventFilter(raw);
        if (saved) useStore.getState().setLocalEventFilter(saved);
      })
      .catch(err => console.error('[useLocalEventFilter] load failed:', err));
  }, []);

  const setFilter = useCallback((next: LocalEventFilter) => {
    setInStore(next);
    setItem(STORAGE_KEY, JSON.stringify(next))
      .catch(err => console.error('[useLocalEventFilter] save failed:', err));
  }, [setInStore]);

  return [filter, setFilter];
};

/** The user's position for distance filtering, or null while it is unknown. */
export const useUserPosition = (): Position | null => {
  const latitude = useStore(s => s.currentLocation.latitude);
  const longitude = useStore(s => s.currentLocation.longitude);
  return useMemo(() => knownPosition({ latitude, longitude }), [latitude, longitude]);
};

/** Local events with the local event filter applied, plus the unfiltered list for counts. */
export const useFilteredLocalEvents = (): { all: ExtendedEvent[]; filtered: ExtendedEvent[] } => {
  const all = useLocalEvents();
  const [filter] = useLocalEventFilter();
  const userPosition = useUserPosition();
  const position = filter.mode === 'distance' ? userPosition : null;
  const filtered = useMemo(() => applyLocalEventFilter(all, filter, position), [all, filter, position]);
  return { all, filtered };
};
