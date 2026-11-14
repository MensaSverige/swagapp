/**
 * How sure we are about where an event is.
 *
 * Most member calendar events have no coordinates of their own: the backend
 * looks up whatever the member site gave it, often a postal code or just a
 * city, and records how big the geocoder's answer was. An event placed from
 * "70218 Örebro" must not look like an address somebody actually typed.
 *
 * Docs: docs/Geocoding.md, docs/Events.md
 */

export type LocationAccuracy = {
  /** What to call the place, in the card's own voice. */
  label: string;
  /** How far off it can be, e.g. "inom ca 14 km". Absent when nobody said. */
  spread?: string;
};

type Extras = { [key: string]: unknown } | null | undefined;

/**
 * Round distances the way a person would say them: metres while the number is
 * small enough to walk, then kilometres, and never more precision than the
 * geocoder earned.
 */
export function formatSpread(meters: number): string {
  if (meters < 950) {
    return `${Math.max(50, Math.round(meters / 50) * 50)} m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Describe an event's coordinates, or null when they are a real address and
 * the card should say nothing extra.
 */
export function describeLocationAccuracy(extras: Extras): LocationAccuracy | null {
  if (!extras || extras.locationApprox !== true) {
    return null;
  }

  const precision = typeof extras.locationPrecision === 'string' ? extras.locationPrecision : undefined;
  const label =
    precision === 'range_interpolated' ? 'Ungefärlig gatuadress' : 'Ungefärlig plats';

  const radius = extras.locationRadiusMeters;
  if (typeof radius === 'number' && Number.isFinite(radius) && radius > 0) {
    return { label, spread: `inom ca ${formatSpread(radius)}` };
  }
  return { label };
}
