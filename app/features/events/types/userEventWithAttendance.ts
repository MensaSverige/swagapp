import {UserEvent} from '../../common/types/user_event';

/**
 * Since user_event.d.ts is a generated type that matches the database model,
 * but the API model includes user specific data and data from the attendance connection collection,
 * we need to create a new type that includes the attendance data.
 *
 * This should be the base type for any User Event extending types.
 */

export type UserEventWithAttendance = UserEvent & {
  attending: boolean;
  number_of_attendees: number;
  attendees: string[];
};
