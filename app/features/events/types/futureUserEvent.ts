import EventWithLocation from './eventWithLocation';
import UserEventWithLocation from './userEventWithLocation';
import {Event} from '../../common/types/event';
import {isFutureEvent} from './futureEvent';
import {UserEventWithAttendance} from './userEventWithAttendance';

export type FutureUserEvent = UserEventWithAttendance & {
  _isFutureUserEvent: true;
};

export function isFutureUserEvent(
  event:
    | Event
    | UserEventWithAttendance
    | EventWithLocation
    | UserEventWithLocation,
): event is FutureUserEvent {
  if (!('owner' in event)) {
    return false; // Not a user event
  }

  return isFutureEvent(event);
}

export default FutureUserEvent;
