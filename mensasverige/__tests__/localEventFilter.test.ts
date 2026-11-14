/**
 * Unit tests for the local event filter: local group keys, distance with the
 * local group's home as fallback, and the stored form.
 */
import { Event } from '../api_schema/types';
import { formatRegionKey, regionKey } from '../features/events/utils/mainEventUtils';
import {
  LOCAL_GROUP_HOMES,
  applyLocalEventFilter,
  describeLocalEventFilter,
  distanceKm,
  eventPosition,
  isLocalEventFilterActive,
  knownPosition,
  localGroupOptions,
  parseLocalEventFilter,
} from '../features/events/utils/localEventFilter';

const local = (id: string, slug: string | null, coords?: { latitude: number; longitude: number }) =>
  ({
    id,
    source: 'calendar',
    name: id,
    start: '2026-12-01T18:00:00',
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    extras: slug ? { regionSlug: slug } : {},
  }) as unknown as Event;

const GOTEBORG = { latitude: 57.7089, longitude: 11.9746 };
const BORAS = { latitude: 57.721, longitude: 12.9401 };
const OREBRO = { latitude: 59.2753, longitude: 15.2134 };

describe('regionKey / formatRegionKey', () => {
  it('reduces the calendar slug to the local group', () => {
    expect(regionKey(local('a', 'lf-väst-intern'))).toBe('lf-väst');
    expect(regionKey(local('a', 'LMA-Örebro-offentlig'))).toBe('lma-örebro');
    expect(regionKey(local('a', 'mensa-nationellt-intern'))).toBeNull();
    expect(regionKey(local('a', null))).toBeNull();
  });

  it('formats a key for display', () => {
    expect(formatRegionKey('lf-väst')).toBe('LF Väst');
    expect(formatRegionKey('lma-mälardalen')).toBe('LMA Mälardalen');
  });

  it('has a home for every local group seen in the calendar', () => {
    for (const key of ['lf-linné', 'lf-nord', 'lf-norrbotten', 'lf-stockholm', 'lf-syd', 'lf-uppsala',
      'lf-väst', 'lf-vätterbygden', 'lf-öst', 'lma-dalarna', 'lma-gävleborg', 'lma-kalmar',
      'lma-mittsverige', 'lma-mälardalen', 'lma-värmland', 'lma-västerbotten', 'lma-örebro']) {
      expect(LOCAL_GROUP_HOMES[key]).toBeDefined();
    }
  });
});

describe('distance', () => {
  it('measures great-circle kilometres', () => {
    expect(distanceKm(GOTEBORG, BORAS)).toBeGreaterThan(55);
    expect(distanceKm(GOTEBORG, BORAS)).toBeLessThan(65);
    expect(distanceKm(GOTEBORG, GOTEBORG)).toBe(0);
  });

  it("uses the event's own place, else its local group's home", () => {
    expect(eventPosition(local('a', 'lma-örebro-intern', BORAS))).toEqual(BORAS);
    expect(eventPosition(local('a', 'lf-väst-intern'))).toEqual(LOCAL_GROUP_HOMES['lf-väst']);
    expect(eventPosition(local('a', 'mensa-nationellt-intern'))).toBeNull();
  });

  it('treats the 0,0 start value as an unknown position', () => {
    expect(knownPosition({ latitude: 0, longitude: 0 })).toBeNull();
    expect(knownPosition(OREBRO)).toEqual(OREBRO);
  });
});

describe('applyLocalEventFilter', () => {
  const vast = local('vast', 'lf-väst-intern');
  const orebro = local('orebro', 'lma-örebro-intern');
  const orebroGroupInBoras = local('boras', 'lma-örebro-intern', BORAS);
  const national = local('national', 'mensa-nationellt-intern');
  const all = [vast, orebro, orebroGroupInBoras, national];

  it('keeps everything for "all" and for an empty group choice', () => {
    expect(applyLocalEventFilter(all, { mode: 'all' }, null)).toEqual(all);
    expect(applyLocalEventFilter(all, { mode: 'regions', regions: [] }, null)).toEqual(all);
  });

  it('keeps the chosen local groups', () => {
    expect(applyLocalEventFilter(all, { mode: 'regions', regions: ['lma-örebro'] }, null))
      .toEqual([orebro, orebroGroupInBoras]);
  });

  it('keeps events near the user, by own place or by the local group home', () => {
    const near = applyLocalEventFilter(all, { mode: 'distance', km: 100 }, GOTEBORG);
    // Göteborg: LF Väst by its home, the Örebro group's event by its own place in Borås.
    expect(near).toEqual([vast, orebroGroupInBoras]);
  });

  it('does not filter on distance without a position', () => {
    expect(applyLocalEventFilter(all, { mode: 'distance', km: 25 }, null)).toEqual(all);
  });
});

describe('localGroupOptions / describe / active', () => {
  it('lists local groups alphabetically with counts', () => {
    const options = localGroupOptions([
      local('a', 'lma-örebro-intern'), local('b', 'lf-väst-intern'), local('c', 'lf-väst-intern'),
      local('d', 'mensa-nationellt-intern'),
    ]);
    expect(options).toEqual([
      { key: 'lf-väst', label: 'LF Väst', count: 2 },
      { key: 'lma-örebro', label: 'LMA Örebro', count: 1 },
    ]);
  });

  it('describes and flags an active filter', () => {
    expect(describeLocalEventFilter({ mode: 'regions', regions: ['lma-örebro', 'lf-väst'] })).toBe('LF Väst, LMA Örebro');
    expect(describeLocalEventFilter({ mode: 'distance', km: 50 })).toBe('Inom 50 km från dig');
    expect(describeLocalEventFilter({ mode: 'all' })).toBeNull();
    expect(isLocalEventFilterActive({ mode: 'regions', regions: [] })).toBe(false);
    expect(isLocalEventFilterActive({ mode: 'distance', km: 25 })).toBe(true);
  });
});

describe('parseLocalEventFilter', () => {
  it('reads what was stored', () => {
    expect(parseLocalEventFilter('{"mode":"regions","regions":["lf-väst"]}')).toEqual({ mode: 'regions', regions: ['lf-väst'] });
    expect(parseLocalEventFilter('{"mode":"distance","km":50}')).toEqual({ mode: 'distance', km: 50 });
    expect(parseLocalEventFilter('{"mode":"all"}')).toEqual({ mode: 'all' });
  });

  it('rejects anything else', () => {
    for (const raw of [null, '', 'not json', '{"mode":"distance","km":-1}', '{"mode":"regions","regions":[1]}', '{"mode":"x"}']) {
      expect(parseLocalEventFilter(raw)).toBeNull();
    }
  });
});
