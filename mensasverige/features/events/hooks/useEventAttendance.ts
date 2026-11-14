import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import { confirmAsync } from '../../common/functions/confirmAsync';
import { AttendanceStatus, attendanceStatus, isMainEventSource } from '../utils/eventAttendance';
import { useEvents } from './useEvents';
import { setMainEventAttendance } from './useMainEvents';

/**
 * The viewer's status for an event and the actions to change it, for every
 * kind of event. Main events go through their own list so the start page and
 * focus mode update; activities through the events list.
 */
export const useEventAttendance = (event: Event): {
  status: AttendanceStatus;
  busy: boolean;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
} => {
  const userId = useStore(s => s.user?.userId);
  const { attendEventById, unattendEventById } = useEvents();
  const [busy, setBusy] = useState(false);
  const status = attendanceStatus(event, userId, Date.now());
  const isMain = isMainEventSource(event);

  const register = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isMain) await setMainEventAttendance(event.id, true);
      else await attendEventById(event.id);
    } catch {
      Alert.alert('Något gick fel', 'Det gick inte att anmäla dig. Försök igen.');
    } finally {
      setBusy(false);
    }
  }, [busy, isMain, event.id, attendEventById]);

  const unregister = useCallback(async () => {
    if (busy) return;
    const confirmed = await confirmAsync('Avanmäl dig?', `Du avanmäls från ${event.name}.`, 'Avanmäl');
    if (!confirmed) return;
    setBusy(true);
    try {
      if (isMain) {
        await setMainEventAttendance(event.id, false);
        // A riksträff registration made on the booking site (or a booking
        // there) stays: say where to leave instead of nothing happening.
        const after = useStore.getState().mainEvents.find(e => e.id === event.id);
        if (after?.attending) {
          Alert.alert(
            'Du är fortfarande anmäld',
            'Din anmälan finns på bokningssidan. Avanmäl dig och avboka aktiviteter där.',
          );
        }
      } else {
        await unattendEventById(event.id);
      }
    } catch {
      Alert.alert('Något gick fel', 'Det gick inte att avanmäla dig. Försök igen.');
    } finally {
      setBusy(false);
    }
  }, [busy, isMain, event.id, event.name, unattendEventById]);

  return { status, busy, register, unregister };
};
