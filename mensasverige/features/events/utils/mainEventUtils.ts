/**
 * Pure helpers for main events (rootEvents and local member-calendar events).
 * Kept free of React and the store so they can be unit tested.
 */
import { Event } from '../../../api_schema/types';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { selectDashboardEvents } from './eventUtils';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Auto-select window: from this long before start ... */
export const AUTO_SELECT_BEFORE_MS = 2 * DAY_MS;
/** ... until this long after end (start when end is missing). */
export const AUTO_SELECT_AFTER_MS = 1 * DAY_MS;

export const MAX_BOOKABLE_PREVIEW = 5;

const WEEKDAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];
const MONTHS_SHORT = [
  'jan', 'feb', 'mars', 'apr', 'maj', 'juni',
  'juli', 'aug', 'sep', 'okt', 'nov', 'dec',
];

const toMs = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
};

const startMs = (e: Event): number | null => toMs(e.start);
/** End, falling back to start when the event has no end. */
const endMs = (e: Event): number | null => toMs(e.end) ?? startMs(e);

const pad2 = (n: number) => String(n).padStart(2, '0');
const timeOf = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isMultiDay = (e: Event): boolean => {
  if (!e.start || !e.end) return false;
  const s = new Date(e.start);
  const en = new Date(e.end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) return false;
  return !sameLocalDay(s, en);
};

/** Now lies between start and end (inclusive). Without an end, only at start. */
export const isMainEventOngoing = (e: Event, now: number): boolean => {
  const s = startMs(e);
  const en = endMs(e);
  if (s === null || en === null) return false;
  return now >= s && now <= en;
};

/**
 * Auto-select rule: the registered main event whose window
 * [start - 2 days, end + 1 day] contains `now`; earliest start wins.
 * Returns null when auto-select was dismissed this session.
 */
export const findAutoSelectMainEventId = (
  events: Event[],
  now: number,
  dismissed: boolean,
): string | null => {
  if (dismissed) return null;
  const candidates = events
    .filter(e => {
      if (!e.attending) return false;
      const s = startMs(e);
      const en = endMs(e);
      if (s === null || en === null) return false;
      return now >= s - AUTO_SELECT_BEFORE_MS && now <= en + AUTO_SELECT_AFTER_MS;
    })
    .sort((a, b) => (startMs(a) as number) - (startMs(b) as number));
  return candidates.length > 0 ? candidates[0].id : null;
};

export interface MainEventGroups {
  ongoing: Event[];
  rootEvents: Event[];
  local: Event[];
}

const byStart = (a: Event, b: Event) => (startMs(a) ?? 0) - (startMs(b) ?? 0);

/** Start-page groups: "Pågår nu", "Kommande rootEvents", "Lokalt". */
export const groupMainEvents = (events: Event[], now: number): MainEventGroups => {
  const ongoing: Event[] = [];
  const rootEvents: Event[] = [];
  const local: Event[] = [];
  for (const e of events) {
    if (isMainEventOngoing(e, now)) ongoing.push(e);
    else if (e.source === 'external_root') rootEvents.push(e);
    else if (e.source === 'calendar') local.push(e);
  }
  return {
    ongoing: ongoing.sort(byStart),
    rootEvents: rootEvents.sort(byStart),
    local: local.sort(byStart),
  };
};

/** "20 nov" */
export const formatShortDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

/** Date column of a row: start/end dates for multi-day, start time otherwise. */
export const formatRowDateColumn = (e: Event): { start: string; end: string } => {
  if (!e.start) return { start: '', end: '' };
  if (isMultiDay(e)) return { start: formatShortDate(e.start), end: formatShortDate(e.end as string) };
  return { start: timeOf(new Date(e.start)), end: '' };
};

const dayLabel = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;

/** "Fredag 20 – söndag 22 november", or "Lördag 21 november, 10:00–16:00". */
export const formatMainEventDateRange = (e: Event): string => {
  if (!e.start) return '';
  const s = new Date(e.start);
  if (Number.isNaN(s.getTime())) return '';
  if (isMultiDay(e)) {
    const en = new Date(e.end as string);
    const sameMonth = s.getMonth() === en.getMonth() && s.getFullYear() === en.getFullYear();
    const left = sameMonth ? dayLabel(s) : `${dayLabel(s)} ${MONTHS[s.getMonth()]}`;
    return capitalize(`${left} – ${dayLabel(en)} ${MONTHS[en.getMonth()]}`);
  }
  const date = capitalize(`${dayLabel(s)} ${MONTHS[s.getMonth()]}`);
  const end = e.end ? new Date(e.end) : null;
  const range = end && !Number.isNaN(end.getTime()) ? `${timeOf(s)}–${timeOf(end)}` : timeOf(s);
  return `${date}, ${range}`;
};

export const getMainEventChildren = <T extends Event>(events: T[], mainId: string): T[] =>
  events.filter(e => e.parentEvent === mainId);

/** The user's upcoming attending children, soonest first. */
export const selectMyBookings = (
  children: ExtendedEvent[],
  now: number = Date.now(),
): ExtendedEvent[] => selectDashboardEvents(children, now);

/** Upcoming bookable children the user is not attending, soonest first, capped. */
export const selectToBook = (
  children: ExtendedEvent[],
  now: number = Date.now(),
  limit: number = MAX_BOOKABLE_PREVIEW,
): ExtendedEvent[] =>
  children
    .filter(e => {
      if (!e.bookable || e.attendingOrHost || !e.start) return false;
      const s = startMs(e);
      return s !== null && s >= now;
    })
    .sort(byStart)
    .slice(0, limit);

/**
 * Visibility rule: a child event is hidden while the user is not registered
 * (`attending === false`) to its main event. Events without a parent, or whose
 * parent is not in `mainEvents`, stay visible.
 */
export const filterVisibleEvents = <T extends Event>(events: T[], mainEvents: Event[]): T[] => {
  const hiddenParents = new Set(mainEvents.filter(m => m.attending === false).map(m => m.id));
  if (hiddenParents.size === 0) return events;
  return events.filter(e => !e.parentEvent || !hiddenParents.has(e.parentEvent));
};

/** Local events come from the member calendar and are main events of their own. */
export const isLocalEvent = (event: Pick<Event, 'source'>): boolean => event.source === 'calendar';

/**
 * The events the Aktiviteter list draws from. Inside a main event: its child
 * events. With none selected: activities that belong to no main event, plus
 * the local events -- a riksträff's programme shows only while that riksträff
 * is selected. Sorted by start, since two lists are merged.
 */
export const selectActivityListEvents = <T extends Event>(
  events: T[],
  localEvents: T[],
  selectedMainEventId: string | null,
): T[] => {
  if (selectedMainEventId) return events.filter(e => e.parentEvent === selectedMainEventId);
  const localIds = new Set(localEvents.map(e => e.id));
  return [...events.filter(e => !e.parentEvent && !localIds.has(e.id)), ...localEvents]
    .sort((a, b) => (startMs(a) ?? 0) - (startMs(b) ?? 0));
};

/**
 * `parentEvent` for a newly created event: the selected main event when the
 * user is registered to it, otherwise null.
 */
export const resolveParentEventForNewEvent = (selectedMainEvent: Event | null): string | null =>
  selectedMainEvent && selectedMainEvent.attending ? selectedMainEvent.id : null;

/** Map: a main event is selected but the user is not registered to it. */
export const isMapLockedForEvent = (selectedMainEvent: Event | null): boolean =>
  !!selectedMainEvent && !selectedMainEvent.attending;

/** Map centre for the selected main event: its coordinates while it is ongoing, else null. */
export const getMainEventMapCenter = (
  e: Event | null,
  now: number,
): { latitude: number; longitude: number } | null => {
  if (!e || typeof e.latitude !== 'number' || typeof e.longitude !== 'number') return null;
  return isMainEventOngoing(e, now) ? { latitude: e.latitude, longitude: e.longitude } : null;
};

/** Name of the main event with this id, or null when it is not in the list. */
export const getMainEventName = (mainEvents: Event[], id: string): string | null =>
  mainEvents.find(e => e.id === id)?.name || null;

const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Relative label for the date row: "Pågår nu", "I dag", "I morgon", "Om N dagar".
 * Days are counted in local calendar days. Returns '' for past or invalid events.
 */
export const formatRelativeStart = (e: Event, now: number): string => {
  const s = startMs(e);
  if (s === null) return '';
  if (isMainEventOngoing(e, now)) return 'Pågår nu';
  if (s < now) return '';
  const days = Math.round((startOfLocalDay(new Date(s)) - startOfLocalDay(new Date(now))) / DAY_MS);
  if (days <= 0) return 'I dag';
  if (days === 1) return 'I morgon';
  return `Om ${days} dagar`;
};

/**
 * Splits an address into street (before the first comma) and the rest (postal
 * code and city). Without a comma, locationDescription is the second line when
 * it differs from the street. Without an address, locationDescription is the
 * only line.
 */
/**
 * The Mensa local group a member calendar event belongs to, for display:
 * `lf-väst-intern` -> "LF Väst", `lma-örebro-intern` -> "LMA Örebro". Every
 * calendar event has one, while few have a place, so it is what tells the
 * reader where an event is. Null for events not from the member calendar.
 */
export const formatRegion = (event: Pick<Event, 'extras'>): string | null => {
  const slug = event.extras?.regionSlug;
  if (typeof slug === 'string') {
    const match = /^(lf|lma)-(.+?)(?:-(?:intern|offentlig))?$/i.exec(slug.trim());
    if (match) {
      const name = match[2].split('-').filter(Boolean).map(capitalize).join(' ');
      return `${match[1].toUpperCase()} ${name}`;
    }
  }
  const region = event.extras?.region;
  return typeof region === 'string' && region.trim() ? capitalize(region.trim()) : null;
};

export const splitAddress = (
  address?: string | null,
  locationDescription?: string | null,
): { line1: string; line2: string } | null => {
  const addr = address?.trim();
  const loc = locationDescription?.trim();
  if (!addr) return loc ? { line1: loc, line2: '' } : null;
  const i = addr.indexOf(',');
  if (i >= 0) return { line1: addr.slice(0, i).trim(), line2: addr.slice(i + 1).trim() };
  return { line1: addr, line2: loc && loc !== addr ? loc : '' };
};
