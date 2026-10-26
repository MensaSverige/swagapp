# /v1/users

Four routes serve the member's own profile and two serve other members'.
`backend/v1/api/users.py` holds them all, and every one takes a bearer access
token through `validate_request`.

| Route | What it does |
|---|---|
| `GET /v1/users?show_location=true` | Members who share their location, for the map. Omitting the parameter is a 400 on purpose. |
| `GET /v1/users/me` | The caller's own row, straight from the token. No privacy filter — you always see yourself. |
| `PUT /v1/users/me` | Updates the caller's profile. `settings` is merged into the stored settings, so a body may carry only what changed. |
| `PUT /v1/users/me/location` | Writes the caller's location and stamps it with server time. |
| `POST /v1/users/me/avatar` | Uploads a JPG or PNG, keeps the three most recent files. |
| `GET /v1/users/{user_id}` | Another member's row, subject to `show_profile` and the per-field privacy settings. |

## Declaration order is load-bearing

The literal `/users/me` routes must be declared **before**
`GET /users/{user_id}`. FastAPI matches in declaration order and the first
match wins, so with the other order `"me"` is handed to an `int` path
parameter and every call returns

    400 ["Input should be a valid integer, unable to parse string as an integer: `path.user_id`"]

That was live for both the Mongo and the Postgres build (SWAGAPP-490). The app
calls `/users/me` first on every start, so it never saw a 200 and fell back to
logging in against Mensa's member API each time.

`__tests__/test_users_routes.py` pins both the status and the route that
matches, because `/users/{user_id}` also answers 200 for the caller's own id —
a status assertion alone would not catch a reorder.

## Privacy filtering

`_apply_privacy_filter` blanks the fields the viewer may not see, driven by
`_PRIVACY_FIELDS` and the viewer's own settings: the `_MUTUAL` values also
require the viewer to have opened the same field up. It never filters the
caller's own row.
Unrecognised stored values read as `NO_ONE`; see `docs/postgres-cutover.md`
for why the write path rejects them instead.
