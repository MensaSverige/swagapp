# Geocoding

Turning an address into coordinates, and remembering the answer.

## Why there is a cache

The member site calendar gives explicit coordinates for 80 of its roughly 4900
events. Everything else has at most a postal code and a city, so the sync asks
Google where that is — 424 distinct places across the whole calendar.

That sync runs every thirty minutes. Without a cache the same 424 lookups are
bought roughly fifty times a day, about 20,000 calls, for answers that do not
change. The cache makes it 424 once.

## How it works

`v1/google_maps_api/geocode_cache.py` is the one way anything in this codebase
asks for coordinates during a sync:

```python
from v1.google_maps_api.geocode_cache import geocode_cached

place = geocode_cached("70218 Örebro, SE")   # GeocodedPlace, or None
place.latitude, place.longitude
place.radius_meters      # how big the geocoder's own box was
place.precision          # rooftop | range_interpolated | geometric_center | approximate
```

- The query is normalized — lowercased, whitespace collapsed — so
  `  70218   Örebro, SE ` and `70218 örebro, se` are one row.
- The answer is stored in the `geocode_cache` table, query as the primary key,
  radius and precision with it.
- **A place the geocoder could not resolve is stored too**, with `found` false.
  Otherwise the addresses nobody can place are the ones paid for most often.
- **A geocoder *failure* is not stored.** An exception or a missing API key
  says nothing about the address, so the next run asks again. The difference
  between "Google says this is nowhere" and "Google did not answer" is the
  whole reason `found` is a column rather than a null latitude.

`geocode_address()` in `geolocation_api.py` is the raw Google call underneath.
Call it directly only where there is no sync and no repetition — the
`/v1/geolocation/{address}` endpoint, which answers one user asking once.

## How sure the answer is

Google returns a viewport around every result and a `location_type` saying what
kind of hit it was. Both are carried through:

- **`radius_meters`** is the distance from the point to the far corner of that
  viewport — a circle that covers the whole box. To a corner rather than an
  edge, because a circle drawn to the edge leaves the corners outside it and
  claims more precision than the geocoder gave. A rooftop hit is tens of
  metres; a city is tens of kilometres. None for a result with no viewport.
- **`precision`** is Google's own `location_type`, lowercased. Not translated
  into vocabulary of our own, so there is nothing to drift.

## Invalidating

Nothing expires a row. A postal code's coordinates do not move, and the table
holds a few hundred rows. If an address is ever geocoded wrongly, delete that
row and the next sync asks again:

```sql
DELETE FROM geocode_cache WHERE query = '70218 örebro, se';
```

## Where approximate coordinates show up

`v1/member_calendar/calendar_db.py` sets these on every event it stores:

| Extra | Meaning |
|---|---|
| `locationApprox` | `false` when the member site gave real coordinates, `true` when they came from a postal code or a city |
| `locationRadiusMeters` | the radius above; absent when the coordinates are exact or the geocoder gave no box |
| `locationPrecision` | the precision above; absent on exact coordinates |

An event with no place at all is never geocoded and carries none of them — see
`_geocode_query`, which returns nothing without a postal code or a city.

## What the app shows

City-only coordinates are a point on the city, not on the venue, so the event
card says so instead of presenting them like an address a member typed.

`features/events/utilities/locationAccuracy.ts` turns the three extras into one
line, and `UnifiedEventCard` prints it under the address:

| Extras | Line |
|---|---|
| `locationApprox` false, or absent | nothing |
| approximate, radius 14200 m | `Ungefärlig plats · inom ca 14 km` |
| approximate, precision `range_interpolated`, radius 180 m | `Ungefärlig gatuadress · inom ca 200 m` |
| approximate, no radius | `Ungefärlig plats` |

Distances read the way a person says them: metres to the nearest fifty while
the number is small, then kilometres with one decimal, then whole kilometres.
Fifty metres is the floor — a tighter figure claims precision the geocoder
never gave.

The address stays tappable, because a map search for `70218 Örebro` is a
sensible thing to open. Its icon changes: an exact address offers directions,
an approximate one shows a plain marker, so nothing offers to navigate a member
to a city centre as though it were the venue.

No map in the app draws these as a circle today, because no screen puts events
on a map at all: `features/map/screens/MapScreen.tsx` renders user markers
only, and `EventMarker`/`ClusterMarker` are unreferenced and import a component
that no longer exists. A circle of `locationRadiusMeters` is the right shape
whenever events do reach the map.
