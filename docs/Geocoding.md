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

coordinates = geocode_cached("70218 Örebro, SE")   # (lat, lng) or None
```

- The query is normalized — lowercased, whitespace collapsed — so
  `  70218   Örebro, SE ` and `70218 örebro, se` are one row.
- The answer is stored in the `geocode_cache` table, query as the primary key.
- **A place the geocoder could not resolve is stored too**, with `found` false.
  Otherwise the addresses nobody can place are the ones paid for most often.
- **A geocoder *failure* is not stored.** An exception or a missing API key
  says nothing about the address, so the next run asks again. The difference
  between "Google says this is nowhere" and "Google did not answer" is the
  whole reason `found` is a column rather than a null latitude.

`geocode_address()` in `geolocation_api.py` is the raw Google call underneath.
Call it directly only where there is no sync and no repetition — the
`/v1/geolocation/{address}` endpoint, which answers one user asking once.

## Invalidating

Nothing expires a row. A postal code's coordinates do not move, and the table
holds a few hundred rows. If an address is ever geocoded wrongly, delete that
row and the next sync asks again:

```sql
DELETE FROM geocode_cache WHERE query = '70218 örebro, se';
```

## Where approximate coordinates show up

`v1/member_calendar/calendar_db.py` sets `extras.locationApprox` on every event
it stores: `false` when the member site gave real coordinates, `true` when they
came from a postal code or a city. An event with no place at all is never
geocoded and carries no flag — see `_geocode_query`, which returns nothing
without a postal code or a city.

City-only coordinates are a pin on the city, not on the venue. `locationApprox`
is what lets the app say so.
