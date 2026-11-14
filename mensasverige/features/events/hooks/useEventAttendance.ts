import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import { confirmAsync } from '../../common/functions/confirmAsync';
import { attendEvent, unattendEvent } from '../services/eventService';
import { createExtendedEvent } from '../utils/eventUtils';
import { AttendanceStatus, attendanceStatus, bookingSiteUrl, isMainEventSource } from '../utils/eventAttendance';
import { setMainEventAttendance } from './useMainEvents';

/**
 * The viewer's status for an event and the actions to change it, for every
 * kind of event and every screen that offers them. `register` opens the
 * booking site where registration happens there (the riksträff); otherwise
 * main events go through their own list, so the start page and focus mode
 * follow, and activities through the events list.
 */
export const useEventAttendance = (event: Event | null): {
  status: AttendanceStatus | null;
  siteUrl: string | null;
  busy: boolean;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
} => {
  const userId = useStore(s => s.user?.userId);
  const mainEvents = useStore(s => s.mainEvents);
  const addOrUpdateEvent = useStore(s => s.addOrUpdateEvent);
  const [busy, setBusy] = useState(false);
  const status = event ? attendanceStatus(event, userId, Date.now()) : null;
  const siteUrl = event ? bookingSiteUrl(event, mainEvents) : null;

  const register = useCallback(async () => {
    if (!event || busy) return;
    if (status?.kind === 'bookingSite' || status?.kind === 'paid') {
      if (siteUrl) Linking.openURL(siteUrl);
      return;
    }
    setBusy(true);
    try {
      if (isMainEventSource(event)) await setMainEventAttendance(event.id, true);
      else addOrUpdateEvent(createExtendedEvent(await attendEvent(event.id), userId));
    } catch {
      Alert.alert('Något gick fel', 'Det gick inte att anmäla dig. Försök igen.');
    } finally {
      setBusy(false);
    }
  }, [event, busy, status?.kind, siteUrl, addOrUpdateEvent, userId]);

  const unregister = useCallback(async () => {
    if (!event || busy) return;
    const confirmed = await confirmAsync('Avanmäl dig?', `Du avanmäls från ${event.name}.`, 'Avanmäl');
    if (!confirmed) return;
    setBusy(true);
    try {
      if (isMainEventSource(event)) {
        await setMainEventAttendance(event.id, false);
      } else {
        await unattendEvent(event.id);
        const existing = useStore.getState().events.find(e => e.id === event.id);
        if (existing) addOrUpdateEvent(createExtendedEvent({ ...existing, attending: false }, userId));
      }
    } catch {
      Alert.alert('Något gick fel', 'Det gick inte att avanmäla dig. Försök igen.');
    } finally {
      setBusy(false);
    }
  }, [event, busy, addOrUpdateEvent, userId]);

  return { status, siteUrl, busy, register, unregister };
};
