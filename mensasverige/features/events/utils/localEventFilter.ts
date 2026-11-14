import { Event } from '../../../api_schema/types';
import { getCoordinateDistance } from '../../map/functions/getCoordinateDistance';
import { formatRegionKey, regionKey } from './mainEventUtils';

/**
 * How local events (the member calendar) are narrowed down: by local group,
 * or by distance from the user -- one or the other, never both. Shared by the
 * Aktiviteter list and the start page, and remembered on the device.
 */
export type LocalEventFilter =
  | { mode: 'all' }
  | { mode: 'regions'; regions: string[] }
  | { mode: 'distance'; km: number };

export const DEFAULT_LOCAL_EVENT_FILTER: LocalEventFilter = { mode: 'all' };
export const DISTANCE_OPTIONS_KM = [25, 50, 100, 200];

export interface Position {
  latitude: number;
  longitude: number;
}

/**
 * Where each local group meets, as one point, for "distance from me" when a
 * local event has no place of its own -- which is most of them. Taken from the
 * towns its past events were held in (Bureå for LF Nord, Kalmar postcodes for
 * LF Linné, Helsingborg and Malmö for LF Syd, hence Lund); the county seat
 * where the calendar had no places. Coarse for the large groups, by design:
 * the point is to keep a group's events in a nearby search, not to measure.
 */
export const LOCAL_GROUP_HOMES: Record<string, Position> = {
  'lf-linné': { latitude: 56.6634, longitude: 16.3568 }, // Kalmar
  'lf-nord': { latitude: 64.7507, longitude: 20.9528 }, // Skellefteå
  'lf-norrbotten': { latitude: 65.5848, longitude: 22.1567 }, // Luleå
  'lf-stockholm': { latitude: 59.3293, longitude: 18.0686 },
  'lf-syd': { latitude: 55.7047, longitude: 13.191 }, // Lund
  'lf-uppsala': { latitude: 59.8586, longitude: 17.6389 },
  'lf-väst': { latitude: 57.7089, longitude: 11.9746 }, // Göteborg
  'lf-vätterbygden': { latitude: 57.7826, longitude: 14.1618 }, // Jönköping
  'lf-öst': { latitude: 58.4108, longitude: 15.6214 }, // Linköping
  'lma-dalarna': { latitude: 60.6065, longitude: 15.6355 }, // Falun
  'lma-gävleborg': { latitude: 60.6749, longitude: 17.1413 }, // Gävle
  'lma-kalmar': { latitude: 56.6634, longitude: 16.3568 },
  'lma-mittsverige': { latitude: 62.3908, longitude: 17.3069 }, // Sundsvall
  'lma-mälardalen': { latitude: 59.6099, longitude: 16.5448 }, // Västerås
  'lma-värmland': { latitude: 59.3793, longitude: 13.5036 }, // Karlstad
  'lma-västerbotten': { latitude: 63.8258, longitude: 20.263 }, // Umeå
  'lma-örebro': { latitude: 59.2753, longitude: 15.2134 },
};

/** Great-circle distance in kilometres. */
export const distanceKm = (a: Position, b: Position): number => getCoordinateDistance(a, b) / 1000;

/** The event's own place when it has one, otherwise its local group's home; null if neither. */
export const eventPosition = (event: Pick<Event, 'latitude' | 'longitude' | 'extras'>): Position | null => {
  if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
    return { latitude: event.latitude, longitude: event.longitude };
  }
  const key = regionKey(event);
  return (key && LOCAL_GROUP_HOMES[key]) || null;
};

/** The user's position from the store, or null while it is unknown (the store starts at 0,0). */
export const knownPosition = (location: Position | null | undefined): Position | null =>
  location && (location.latitude !== 0 || location.longitude !== 0) ? location : null;

export const isLocalEventFilterActive = (filter: LocalEventFilter): boolean =>
  filter.mode === 'distance' || (filter.mode === 'regions' && filter.regions.length > 0);

/**
 * Whether one local event passes the filter. Distance needs the user's
 * position: without one the filter cannot apply, and the event is kept
 * rather than hidden for a reason the user cannot see.
 */
export const matchesLocalEventFilter = (
  event: Pick<Event, 'latitude' | 'longitude' | 'extras'>,
  filter: LocalEventFilter,
  userPosition: Position | null,
): boolean => {
  if (filter.mode === 'regions') {
    if (filter.regions.length === 0) return true;
    const key = regionKey(event);
    return !!key && filter.regions.includes(key);
  }
  if (filter.mode === 'distance' && userPosition) {
    const pos = eventPosition(event);
    return !!pos && distanceKm(userPosition, pos) <= filter.km;
  }
  return true;
};

/** Local events that pass the filter; the same array when nothing is filtered. */
export const applyLocalEventFilter = <T extends Pick<Event, 'latitude' | 'longitude' | 'extras'>>(
  events: T[],
  filter: LocalEventFilter,
  userPosition: Position | null,
): T[] =>
  isLocalEventFilterActive(filter) ? events.filter(e => matchesLocalEventFilter(e, filter, userPosition)) : events;

export interface LocalGroupOption {
  key: string;
  label: string;
  count: number;
}

/** The local groups among the given events, alphabetically, with how many events each has. */
export const localGroupOptions = (events: Pick<Event, 'extras'>[]): LocalGroupOption[] => {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = regionKey(e);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: formatRegionKey(key), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'sv'));
};

/** One line saying what the filter keeps, e.g. "LF Väst, LMA Örebro" or "Inom 50 km från dig". */
export const describeLocalEventFilter = (filter: LocalEventFilter): string | null => {
  if (filter.mode === 'regions' && filter.regions.length > 0) {
    return filter.regions.map(formatRegionKey).sort((a, b) => a.localeCompare(b, 'sv')).join(', ');
  }
  if (filter.mode === 'distance') return `Inom ${filter.km} km från dig`;
  return null;
};

/** A stored filter, or null when the text is missing or not a filter this version understands. */
export const parseLocalEventFilter = (raw: string | null | undefined): LocalEventFilter | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.mode === 'all') return { mode: 'all' };
    if (value?.mode === 'regions' && Array.isArray(value.regions)
        && value.regions.every((r: unknown) => typeof r === 'string')) {
      return { mode: 'regions', regions: value.regions };
    }
    if (value?.mode === 'distance' && typeof value.km === 'number' && value.km > 0) {
      return { mode: 'distance', km: value.km };
    }
  } catch {
    // Unreadable: fall through to null, which leaves the default in place.
  }
  return null;
};
