import { Event } from '../../../api_schema/types';

export interface EventFilter {
  attendingOrHost?: boolean;
  upcoming?: boolean;
  limit?: number;
}

/**
 * Extended Event type with computed properties
 */
export interface ExtendedEvent extends Event {
  /** Whether the user is attending or is a host/admin */
  attendingOrHost: boolean;
}

export interface GroupedEvents {
  [key: string]: ExtendedEvent[];
}