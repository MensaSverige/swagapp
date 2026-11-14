import { useCallback, useEffect, useMemo } from 'react';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import { attendEvent, fetchMainEvents, unattendEvent } from '../services/eventService';
import { findAutoSelectMainEventId, isLocalEvent } from '../utils/mainEventUtils';
import { createExtendedEvent } from '../utils/eventUtils';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { prefetchUsers, refreshEventsList } from './useEvents';

let isFetchingMain = false;

/** Fetch main events and apply the auto-select rule. Safe to call repeatedly. */
export const refreshMainEvents = async (): Promise<void> => {
  if (isFetchingMain) return;
  isFetchingMain = true;
  const state = useStore.getState();
  try {
    state.setMainEventsLoading(true);
    const list = await fetchMainEvents();
    state.setMainEvents(Array.isArray(list) ? list : []);
    // Hosts and participants, shown with their profiles when they have an account.
    // The riksträff's list says which participants have one; look up only those.
    prefetchUsers((Array.isArray(list) ? list : []).flatMap(e => {
      const accounts = e.extras?.attendeeAccounts;
      const participants = Array.isArray(accounts)
        ? (accounts as number[])
        : (e.attendees ?? []).map(a => a.userId);
      return [...(e.admin ?? []), ...participants];
    }));
    state.setMainEventsInitialized(true);

    const { selectedMainEventId, autoSelectDismissed, mainEvents } = useStore.getState();
    if (selectedMainEventId && !mainEvents.some(e => e.id === selectedMainEventId)) {
      // The selected event has ended or disappeared.
      useStore.setState({ selectedMainEventId: null });
    }
    if (!useStore.getState().selectedMainEventId) {
      const id = findAutoSelectMainEventId(mainEvents, Date.now(), autoSelectDismissed);
      if (id) useStore.getState().autoSelectMainEvent(id);
    }
  } catch (err) {
    console.error('Error loading main events:', err);
    state.setMainEventsInitialized(true);
  } finally {
    isFetchingMain = false;
    useStore.getState().setMainEventsLoading(false);
  }
};

/** Register / unregister a main event, then refresh main events and the events list. */
export const setMainEventAttendance = async (mainId: string, attend: boolean): Promise<void> => {
  if (attend) await attendEvent(mainId);
  else await unattendEvent(mainId);
  await Promise.all([refreshMainEvents(), refreshEventsList()]);
};

/**
 * Loads main events on mount and when the user changes. Call once per screen
 * that owns the Information tab; other screens read via useSelectedMainEvent().
 */
export const useMainEvents = () => {
  const user = useStore(s => s.user);
  const mainEvents = useStore(s => s.mainEvents);
  const loading = useStore(s => s.mainEventsLoading);
  const initialized = useStore(s => s.mainEventsInitialized);
  const setMainEventsInitialized = useStore(s => s.setMainEventsInitialized);

  useEffect(() => {
    if (!user) setMainEventsInitialized(false);
  }, [user, setMainEventsInitialized]);

  useEffect(() => {
    if (user && !initialized) refreshMainEvents();
  }, [user, initialized]);

  const attend = useCallback((id: string) => setMainEventAttendance(id, true), []);
  const unattend = useCallback((id: string) => setMainEventAttendance(id, false), []);

  return {
    mainEvents,
    loading: loading && !initialized,
    initialized,
    refetch: refreshMainEvents,
    attend,
    unattend,
  };
};

/** The currently selected main event (or null) plus the actions to change it. */
export const useSelectedMainEvent = (): {
  selectedMainEvent: Event | null;
  selectedMainEventId: string | null;
  selectMainEvent: (id: string) => void;
  leaveMainEvent: () => void;
} => {
  const selectedMainEventId = useStore(s => s.selectedMainEventId);
  const mainEvents = useStore(s => s.mainEvents);
  const selectMainEvent = useStore(s => s.selectMainEvent);
  const leaveMainEvent = useStore(s => s.leaveMainEvent);
  const selectedMainEvent = useMemo(
    () => mainEvents.find(e => e.id === selectedMainEventId) ?? null,
    [mainEvents, selectedMainEventId],
  );
  return { selectedMainEvent, selectedMainEventId, selectMainEvent, leaveMainEvent };
};

/**
 * Local (member calendar) events, taken from the main-event list and shaped
 * for the activity list and the event page, which work on ExtendedEvent.
 */
export const useLocalEvents = (): ExtendedEvent[] => {
  const mainEvents = useStore(s => s.mainEvents);
  const userId = useStore(s => s.user?.userId);
  return useMemo(
    () => mainEvents.filter(isLocalEvent).map(e => createExtendedEvent(e, userId)),
    [mainEvents, userId],
  );
};
