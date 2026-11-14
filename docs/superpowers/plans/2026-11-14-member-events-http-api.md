# Member Site Events API Implementation Plan

> **For agentic workers:** this project is `stepDispatch: agentic`. The session that picks this up does the work itself, task by task, in order. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read medlem.mensa.se calendar events over an authenticated HTTP endpoint instead of tunnelling into the member site's MySQL, so the sync can run in staging and production.

**Architecture:** A single PHP 5.6 file on the member site answers `GET /swagapp/events.php` with the raw `calendar_events` rows as JSON, authenticated by an API key checked against a stored SHA-256 hash. The file is a thin SQL-to-JSON window: it does no shaping, so every mapping decision stays in Python where the tests are. The backend's existing `row_to_event()` already takes a dict keyed by those exact column names, so only the fetch changes — the mapping, storage and job stay as they are.

**Tech Stack:** PHP 5.6 + mysqli on the member site (nginx + php5-fpm); Python FastAPI backend with `requests` and `requests-mock`.

---

## Context the implementer needs

Facts established by inspecting the live server on 2026-11-14. Do not re-derive them; do re-check anything that looks wrong.

| Thing | Value |
|---|---|
| Member site software | Invision Community Suite 4.1.13.2 (2016) |
| Web root | `/usr/share/nginx/mensa`, owned `www-data:www-data` |
| Web PHP | **5.6** (php5-fpm). The CLI is 7.1 — do not be fooled, target 5.6 |
| SSH account | `pontus`, port 54599, key auth. **No sudo, cannot write the web root** |
| Database | MySQL `ips` on localhost, credentials in `/usr/share/nginx/mensa/conf_global.php` (world-readable) |
| Approved events | 4932 of 4936 rows, ~6 MB of raw content |
| Secrets | `MEDLEM_HOST`, `MEDLEM_PORT`, `MEDLEM_USERNAME`, `MEDLEM_SSH_KEY` in swagapp's **dev** secret space |

**Why not the member site's own REST API.** IPS already serves one at `/api/` with key auth, and a key with `calendar/events` read access already exists. It is unusable for three reasons, all verified against the live endpoint:

1. Every event's `id` comes back `null` — `IPS\calendar\Event::apiOutput()` returns `$this->tid`, and `calendar_events` has no `event_tid` column. Without an id there is no stable key to upsert on.
2. Every event embeds its author as a full member record: email address, registration IP, join date and custom contact fields. Pulling that into our database is a data-protection problem we do not need.
3. `perPage` is ignored and fixed at 25, so a full read is 198 requests.

**SSH access for the implementer.** Write the key to the session scratchpad (never the repo), then use it:

```bash
SP="$CLAUDE_SCRATCHPAD"            # session scratchpad directory
# fetch MEDLEM_SSH_KEY from the dev secret space into "$SP/medlem_key", chmod 600
ssh -i "$SP/medlem_key" -p 54599 -o StrictHostKeyChecking=accept-new pontus@medlem.mensa.se
```

A helper for running SQL on the member site without ever printing the database password — copy it to `~/q.php` on the server and pipe SQL into `php ~/q.php`:

```php
<?php
include '/usr/share/nginx/mensa/conf_global.php';
$m = new mysqli($INFO['sql_host'], $INFO['sql_user'], $INFO['sql_pass'], $INFO['sql_database']);
if ($m->connect_error) { fwrite(STDERR, "CONNECT FAIL: ".$m->connect_error."\n"); exit(1); }
$m->set_charset('utf8mb4');
$res = $m->query(stream_get_contents(STDIN));
if ($res === false) { fwrite(STDERR, "QUERY FAIL: ".$m->error."\n"); exit(1); }
if ($res === true) { echo "OK affected=".$m->affected_rows."\n"; exit(0); }
while ($row = $res->fetch_assoc()) { echo json_encode($row, JSON_UNESCAPED_UNICODE)."\n"; }
```

---

## File Structure

**New — the member site endpoint.** Versioned here, deployed by hand. It is not part of any image or CI job.

- `medlem-api/events.php` — the endpoint. Auth, one query, JSON out. Nothing else.
- `medlem-api/config.sample.php` — the shape of the untracked `config.php` that holds the key hash.
- `medlem-api/README.md` — what it is, how to install it, how to rotate the key.
- `medlem-api/.gitignore` — ignores `config.php`, so a real key hash can never be committed from a working copy.

**Changed — the backend.**

- `backend/v1/member_calendar/ips_source.py` — keeps every mapping function unchanged; `fetch_member_calendar_events()` swaps the SSH tunnel for one HTTP call.
- `backend/v1/env_constants.py` — `MEDLEM_EVENTS_URL` and `MEDLEM_EVENTS_API_KEY` in, the eight `IPS_*` settings out.
- `backend/v1/jobs/refresh_member_calendar.py` — its configuration guard reads the new settings.
- `backend/v1/requirements.txt` — `pymysql` and `sshtunnel` out.
- `docker-compose.yml` — the `IPS_*` block becomes the two new settings.
- `backend/__tests__/member_calendar-test.py` — the two SSH-key tests and the tunnel test go; HTTP fetch tests arrive.
- `backend/v1/member_calendar/README.md` and `docs/EventsUnified.md` — describe the HTTP path.

---

## Task 1: The endpoint's configuration and its sample

**Files:**
- Create: `medlem-api/config.sample.php`
- Create: `medlem-api/.gitignore`

- [ ] **Step 1: Write the gitignore first, so no real config can ever be staged**

`medlem-api/.gitignore`:

```gitignore
# The live config holds the API key hash and the path to the member site's
# own configuration. It is written on the server, never in the repo.
config.php
```

- [ ] **Step 2: Write the sample config**

`medlem-api/config.sample.php`:

```php
<?php
/**
 * Copy to config.php on the member site and fill in.
 * config.php is not in version control.
 */
return array(
    // sha256 of the API key, lowercase hex. Generate both halves with:
    //   KEY=$(openssl rand -hex 32); echo "key:  $KEY"; printf %s "$KEY" | sha256sum
    // Keep the key itself in swagapp's secret vault; only the hash lives here.
    'key_hash' => '',

    // The member site's own configuration, which carries the database
    // credentials. Read rather than copied, so a credential change on the
    // site does not need a change here.
    'ips_config' => '/usr/share/nginx/mensa/conf_global.php',
);
```

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Projects/swagapp
git commit -m "Add member site API config sample" -- medlem-api/
```

---

## Task 2: The endpoint itself

PHP 5.6: no scalar type hints, no return types, no `??`, no short closures. `hash_equals()` exists in 5.6 and is the right comparison.

**Files:**
- Create: `medlem-api/events.php`

- [ ] **Step 1: Write the endpoint**

`medlem-api/events.php`:

```php
<?php
/**
 * Read-only window onto the member site's calendar events, for the Mensa
 * Sweden swag app backend.
 *
 * Deliberately thin: authenticate, run one query, print the rows. No shaping
 * happens here, because this file is deployed by hand onto a server whose
 * source can change underneath us -- every decision that might need revising
 * belongs in the backend, where it is under test. The column names below are
 * the contract; `row_to_event()` in the backend reads exactly these.
 *
 * Target: PHP 5.6 (php5-fpm), Invision Community Suite 4.1.
 * Docs: medlem-api/README.md
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function fail($status, $code) {
    header('HTTP/1.1 ' . $status);
    echo json_encode(array('error' => $code));
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_readable($configPath)) {
    fail('500 Internal Server Error', 'NOT_CONFIGURED');
}
$config = include $configPath;
if (!is_array($config) || empty($config['key_hash'])) {
    fail('500 Internal Server Error', 'NOT_CONFIGURED');
}

/* Authenticate. A custom header is used rather than Authorization because
   nginx hands HTTP_X_API_KEY to FastCGI reliably, while HTTP_AUTHORIZATION
   survives only some configurations -- IPS's own dispatcher scans for several
   spellings of it for that reason. */
$presented = isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : '';
if (!hash_equals(strtolower($config['key_hash']), hash('sha256', $presented))) {
    fail('401 Unauthorized', 'BAD_KEY');
}

/* The member site's own configuration carries the database credentials. */
$ipsConfig = isset($config['ips_config']) ? $config['ips_config'] : '/usr/share/nginx/mensa/conf_global.php';
if (!is_readable($ipsConfig)) {
    fail('500 Internal Server Error', 'NO_SITE_CONFIG');
}
include $ipsConfig;
if (!isset($INFO) || !isset($INFO['sql_database'])) {
    fail('500 Internal Server Error', 'NO_SITE_CONFIG');
}

$db = new mysqli(
    $INFO['sql_host'],
    $INFO['sql_user'],
    $INFO['sql_pass'],
    $INFO['sql_database'],
    isset($INFO['sql_port']) && $INFO['sql_port'] ? (int) $INFO['sql_port'] : 3306
);
if ($db->connect_error) {
    fail('503 Service Unavailable', 'DATABASE_UNAVAILABLE');
}
$db->set_charset('utf8mb4');

/* Approved events only, every calendar including the internal ones: the app
   is members-only and shows the same calendars the member site does.
   No member email, IPS id or IP address is selected. `mensa_id` is the Mensa
   membership number, which is how the app identifies a person, so the
   organiser can be linked to their profile there. */
$sql = "
    SELECT
        e.event_id,
        e.event_title,
        e.event_content,
        e.event_location,
        e.event_start_date,
        e.event_end_date,
        e.event_all_day,
        e.event_rsvp,
        e.event_rsvp_limit,
        e.event_saved,
        e.event_lastupdated,
        e.event_calendar_id,
        c.cal_title_seo,
        m.name AS organizer_name,
        m.mensa_id AS organizer_mensa_id
    FROM calendar_events e
    LEFT JOIN calendar_calendars c ON c.cal_id = e.event_calendar_id
    LEFT JOIN core_members m ON m.member_id = e.event_member_id
    WHERE e.event_approved = 1
    ORDER BY e.event_id ASC
";

$result = $db->query($sql);
if ($result === false) {
    fail('500 Internal Server Error', 'QUERY_FAILED');
}

$events = array();
while ($row = $result->fetch_assoc()) {
    $events[] = $row;
}
$result->free();
$db->close();

$body = json_encode(array(
    'generated_at' => time(),
    'count'        => count($events),
    'events'       => $events,
), JSON_UNESCAPED_UNICODE);

/* ~6 MB of event bodies compresses to well under a megabyte, and the backend
   reads this every half hour. requests() decompresses transparently. */
if (strpos(isset($_SERVER['HTTP_ACCEPT_ENCODING']) ? $_SERVER['HTTP_ACCEPT_ENCODING'] : '', 'gzip') !== false) {
    $gzipped = gzencode($body, 6);
    if ($gzipped !== false) {
        header('Content-Encoding: gzip');
        $body = $gzipped;
    }
}
header('Content-Length: ' . strlen($body));
echo $body;
```

- [ ] **Step 2: Check it parses under 5.6 before it goes anywhere**

The member site has every interpreter installed, so lint it there against the version that will actually run it:

```bash
SP="$CLAUDE_SCRATCHPAD"
scp -i "$SP/medlem_key" -P 54599 medlem-api/events.php pontus@medlem.mensa.se:~/events.php
ssh -i "$SP/medlem_key" -p 54599 pontus@medlem.mensa.se 'php5.6 -l ~/events.php'
```

Expected: `No syntax errors detected in /home/pontus/events.php`

- [ ] **Step 3: Prove the query returns what the contract promises**

Run the SELECT from the endpoint through `~/q.php` with `LIMIT 3` appended and confirm each of the fifteen column names appears in the output, `organizer_name` and `organizer_mensa_id` included.

- [ ] **Step 4: Commit**

```bash
git commit -m "Add read-only calendar events endpoint for the member site" -- medlem-api/events.php
```

---

## Task 3: Install instructions

**Files:**
- Create: `medlem-api/README.md`

- [ ] **Step 1: Write the README**

It must answer, for someone who has never seen this: what the file is, where it goes, how the key is made and rotated, and how to tell whether it is working. Required sections, with the real commands:

- **What this is** — one read-only endpoint on medlem.mensa.se, called by the swag app backend every 30 minutes. Not deployed by CI, on purpose: the member site is maintained by other people and we cannot know what changed between our iterations.
- **Install** — `events.php` and `config.php` into a `swagapp/` directory under `/usr/share/nginx/mensa`. nginx already routes any `.php` under the web root to php5-fpm (`location ~ [^/]\.php(/|$)`), so no nginx change is needed. `/api/` is taken by IPS's own REST API — do not install there.
- **Making the key** — `KEY=$(openssl rand -hex 32)`, hash with `printf %s "$KEY" | sha256sum`, hash into `config.php`, key into swagapp's secret vault as `MEDLEM_EVENTS_API_KEY` in staging and prod.
- **Rotating** — write the new hash, confirm the endpoint answers with the new key, then update the vault. The backend logs a warning and leaves the last sync in place while the key is wrong, so a brief mismatch loses nothing.
- **Checking it works** — the two curl calls from Task 4.
- **Permissions note** — the `pontus` account cannot write the web root and has no sudo, so either an administrator installs the file, or they symlink a directory in `/home/pontus` into the web root (`mensa_verify` and `testrapport` are already set up that way) and we deploy over SSH afterwards.

- [ ] **Step 2: Commit**

```bash
git commit -m "Document how to install the member site events endpoint" -- medlem-api/README.md
```

---

## Task 4: Deploy and verify at the consumer

This task cannot complete until Mikael has answered how the file gets into the web root. Everything after it can be written and tested without it.

- [ ] **Step 1: Place the files**

`events.php` and a `config.php` holding the hash of a freshly generated key, in `/usr/share/nginx/mensa/swagapp/`.

- [ ] **Step 2: Prove the key is actually checked**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://medlem.mensa.se/swagapp/events.php
curl -s -o /dev/null -w '%{http_code}\n' -H 'X-Api-Key: wrong' https://medlem.mensa.se/swagapp/events.php
```

Expected: `401` for both. A check that cannot fail is not a check — if either returns 200, stop and fix it before going further.

- [ ] **Step 3: Prove it returns the events**

```bash
curl -s --compressed -H "X-Api-Key: $KEY" https://medlem.mensa.se/swagapp/events.php \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["count"]); print(sorted(d["events"][0].keys()))'
```

Expected: a count near 4932, and the fifteen contract column names.

- [ ] **Step 4: Store the key**

```bash
grit secret set MEDLEM_EVENTS_API_KEY --environment staging
grit secret set MEDLEM_EVENTS_API_KEY --environment prod
```

Confirm with `secret_list` that the key is listed in both.

---

## Task 5: The backend reads the endpoint

`row_to_event()` already takes a dict keyed by the column names above, which is why this is a small change: only the fetch is replaced. Keep every other function in the file exactly as it is.

**Files:**
- Modify: `backend/v1/env_constants.py`
- Modify: `backend/v1/member_calendar/ips_source.py`
- Test: `backend/__tests__/member_calendar-test.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/__tests__/member_calendar-test.py`:

```python
# -- HTTP source ---------------------------------------------------------------

import requests_mock

from v1.member_calendar import ips_source


_ROW = {
    "event_id": 5137,
    "event_title": "Jultraff Mensa Nord",
    "event_content": "<p>Kom och fika</p>",
    "event_location": '{"addressLines":["Jagargatan 34"],"city":"Burea","postalCode":"93251","country":"SE","lat":null,"long":null}',
    "event_start_date": "2026-11-28 00:00:00",
    "event_end_date": "2026-11-29 00:00:00",
    "event_all_day": 1,
    "event_rsvp": 0,
    "event_rsvp_limit": None,
    "event_saved": 1762000000,
    "event_lastupdated": 1762000500,
    "event_calendar_id": 22,
    "cal_title_seo": "lf-nord-intern",
    "organizer_name": "Hans Brettschneider",
    "organizer_mensa_id": 2003148,
}


def _configure(monkeypatch, url="https://medlem.example/swagapp/events.php", key="k"):
    monkeypatch.setattr(ips_source, "MEDLEM_EVENTS_URL", url)
    monkeypatch.setattr(ips_source, "MEDLEM_EVENTS_API_KEY", key)
    return url


def test_fetch_returns_mapped_events(monkeypatch):
    url = _configure(monkeypatch)
    with requests_mock.Mocker() as m:
        m.get(url, json={"generated_at": 1, "count": 1, "events": [_ROW]})
        events = ips_source.fetch_member_calendar_events()
    assert len(events) == 1
    assert events[0].source_id == "5137"
    assert events[0].city == "Burea"
    assert events[0].region == "nord"
    assert events[0].organizer == "Hans Brettschneider"
    assert events[0].organizer_id == 2003148
    assert events[0].start == datetime.datetime(2026, 11, 28, 0, 0)


def test_fetch_sends_the_api_key(monkeypatch):
    url = _configure(monkeypatch, key="secret-key")
    with requests_mock.Mocker() as m:
        m.get(url, json={"events": []})
        ips_source.fetch_member_calendar_events()
        assert m.last_request.headers["X-Api-Key"] == "secret-key"


def test_fetch_without_configuration_is_a_no_op(monkeypatch):
    _configure(monkeypatch, url=None)
    assert ips_source.fetch_member_calendar_events() == []


def test_fetch_survives_an_unauthorized_response(monkeypatch):
    url = _configure(monkeypatch)
    with requests_mock.Mocker() as m:
        m.get(url, status_code=401, json={"error": "BAD_KEY"})
        assert ips_source.fetch_member_calendar_events() == []


def test_fetch_survives_a_connection_failure(monkeypatch):
    url = _configure(monkeypatch)
    with requests_mock.Mocker() as m:
        m.get(url, exc=requests.exceptions.ConnectTimeout)
        assert ips_source.fetch_member_calendar_events() == []


def test_fetch_skips_a_row_it_cannot_place(monkeypatch):
    """One unusable row must not discard the rest of the sync."""
    url = _configure(monkeypatch)
    undated = dict(_ROW, event_id=99, event_start_date=None)
    with requests_mock.Mocker() as m:
        m.get(url, json={"events": [undated, _ROW]})
        events = ips_source.fetch_member_calendar_events()
    assert [e.source_id for e in events] == ["5137"]
```

Add `import requests` to the test file's imports if it is not already there.

- [ ] **Step 2: Run them and watch them fail**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -k "fetch" -p no:cacheprovider
```

Expected: errors — `ips_source` has no attribute `MEDLEM_EVENTS_URL`.

- [ ] **Step 3: Add the settings**

In `backend/v1/env_constants.py`, delete the eight `IPS_*` lines and add:

```python
    MEDLEM_EVENTS_URL = os.getenv('MEDLEM_EVENTS_URL')
    MEDLEM_EVENTS_API_KEY = os.getenv('MEDLEM_EVENTS_API_KEY')
```

Leave the `raise ValueError` guard below alone: these two are optional, and an unconfigured environment must still start.

- [ ] **Step 4: Replace the fetch**

In `backend/v1/member_calendar/ips_source.py`, replace the module docstring, the imports, `_ssh_tunnel()` and `fetch_member_calendar_events()`. Keep `EVENT_URL`, `_strip_html`, `_unix_to_utc`, `_parse_location`, `_coord`, `_text`, `clean_region` and `row_to_event` exactly as they are, and delete `EVENTS_QUERY` — the query lives in `medlem-api/events.php` now.

New docstring:

```python
"""Reads the member site calendar from the endpoint we run on that site.

medlem.mensa.se runs Invision Community Suite, whose calendar lives in a
`calendar_events` table. `medlem-api/events.php` -- deployed by hand on that
server, versioned in this repository -- authenticates with an API key and
returns those rows as JSON. We read them rather than the site's own REST API,
which returns null event ids and embeds each organiser's email address and IP.

An earlier version of this file reached the same table through an SSH tunnel.
That needed a key and a database password in every environment, so it only
ever ran in development.

IPS is an implementation detail of this file and of the PHP endpoint. The
column names below are the contract between them. Everything downstream works
in terms of `MemberCalendarEvent`.

Docs: backend/v1/member_calendar/README.md
"""
```

New imports — drop `os`, `pymysql` and `sshtunnel`, add `requests`:

```python
import json
import logging
import re
from datetime import datetime, timezone
from typing import List, Optional

import requests

from v1.member_calendar.calendar_model import MemberCalendarEvent
from v1.env_constants import MEDLEM_EVENTS_URL, MEDLEM_EVENTS_API_KEY
```

New fetch, replacing the old one and `_ssh_tunnel()`:

```python
# Long enough for the member site to assemble ~6 MB of events on a 2016 server.
FETCH_TIMEOUT_SECONDS = 120


def fetch_member_calendar_events() -> List[MemberCalendarEvent]:
    """Fetch every approved calendar event from the member site endpoint.

    Returns an empty list on any failure: a calendar we cannot reach should
    leave the last successful sync in place, not break the scheduler.
    """
    if not MEDLEM_EVENTS_URL or not MEDLEM_EVENTS_API_KEY:
        logger.warning("Member calendar endpoint not configured, skipping sync")
        return []

    try:
        response = requests.get(
            MEDLEM_EVENTS_URL,
            headers={"X-Api-Key": MEDLEM_EVENTS_API_KEY, "Accept-Encoding": "gzip"},
            timeout=FETCH_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        rows = response.json().get("events", [])
    except Exception as e:
        logger.error("Failed to fetch member calendar events: %s", e, exc_info=True)
        return []

    logger.info("Fetched %d rows from the member calendar endpoint", len(rows))
    return [e for e in (row_to_event(r) for r in rows) if e is not None]
```

- [ ] **Step 5: Run the tests**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -p no:cacheprovider
```

Expected: the new fetch tests pass. `test_events_query_targets_real_tables`, `test_ssh_tunnel_can_be_built`, `test_missing_ssh_key_file_skips_the_sync` and `test_empty_ssh_key_file_skips_the_sync` now fail — they test machinery that is gone. Delete those four tests; they are replaced by the fetch tests above.

- [ ] **Step 6: Run them again, then the whole suite**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -p no:cacheprovider
cd backend && python -m pytest -p no:cacheprovider -q
```

Expected: all green. Run the whole suite, not just this file — the rule here is that a change is not done while it breaks the neighbour.

- [ ] **Step 7: Commit**

```bash
git commit -m "Read member calendar events over HTTP instead of an SSH tunnel" -- \
  backend/v1/env_constants.py backend/v1/member_calendar/ips_source.py \
  backend/__tests__/member_calendar-test.py
```

---

## Task 5a: Carry the organiser's membership number through

The mapper already turns an organiser into an `EventHost`, but with `userId=0`
because the tunnel could not resolve one. The endpoint can, so the host becomes
a real person the app can link to a profile.

**Files:**
- Modify: `backend/v1/member_calendar/calendar_model.py`
- Modify: `backend/v1/member_calendar/ips_source.py`
- Modify: `backend/v1/events/events_mappers.py:285-286`
- Test: `backend/__tests__/member_calendar-test.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_organizer_id_becomes_the_host_user_id():
    store_member_calendar_events([_event(source_id="hosted-id", organizer="Pontus", organizer_id=2003148)])
    hosts = get_all_member_calendar_events()[0].hosts
    assert [(h.userId, h.fullName) for h in hosts] == [(2003148, "Pontus")]


def test_organizer_without_a_membership_number_still_hosts():
    """8789 of 8799 members have one. The rest must not lose their name."""
    store_member_calendar_events([_event(source_id="hosted-anon", organizer="Pontus", organizer_id=None)])
    hosts = get_all_member_calendar_events()[0].hosts
    assert [(h.userId, h.fullName) for h in hosts] == [(0, "Pontus")]


def test_row_to_event_reads_the_membership_number():
    event = ips_source.row_to_event(dict(_ROW, organizer_mensa_id=2003148))
    assert event.organizer_id == 2003148


def test_zero_membership_number_is_none():
    """The column is 0, not NULL, for a member who has no number."""
    event = ips_source.row_to_event(dict(_ROW, organizer_mensa_id=0))
    assert event.organizer_id is None
```

Add `organizer_id=None` to the `base` dict in the `_event()` helper so the
existing tests keep passing unchanged.

- [ ] **Step 2: Run them and watch them fail**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -k "organizer or membership" -p no:cacheprovider
```

Expected: failures — `MemberCalendarEvent` has no field `organizer_id`.

- [ ] **Step 3: Add the field to the model**

In `backend/v1/member_calendar/calendar_model.py`, below `organizer`:

```python
    organizer_id: Optional[int] = Field(
        None, description="Organizer's Mensa membership number, if the source has one")
```

- [ ] **Step 4: Read it in `row_to_event`**

In `backend/v1/member_calendar/ips_source.py`, replace the `organizer=None` line
and its comment in `row_to_event` with:

```python
        organizer=_text(row.get("organizer_name")),
        # The column is 0 rather than NULL for the handful of members without
        # a membership number, and 0 is not a member.
        organizer_id=int(row["organizer_mensa_id"]) or None if row.get("organizer_mensa_id") else None,
```

- [ ] **Step 5: Use it in the mapper**

In `backend/v1/events/events_mappers.py`, in `map_member_calendar_event`:

```python
        hosts=([EventHost(userId=calendar_event.organizer_id or 0,
                          fullName=calendar_event.organizer)]
               if calendar_event.organizer else []),
```

- [ ] **Step 6: Run the tests**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -p no:cacheprovider
cd backend && python -m pytest -p no:cacheprovider -q
```

Expected: all green.

- [ ] **Step 7: Commit**

```bash
git commit -m "Carry the member calendar organiser's membership number" -- \
  backend/v1/member_calendar/calendar_model.py backend/v1/member_calendar/ips_source.py \
  backend/v1/events/events_mappers.py backend/__tests__/member_calendar-test.py
```

---

## Task 6: Retire the tunnel's leftovers

**Files:**
- Modify: `backend/v1/jobs/refresh_member_calendar.py`
- Modify: `backend/v1/requirements.txt`
- Modify: `docker-compose.yml:40-47`

- [ ] **Step 1: Write the failing test**

Append to `backend/__tests__/member_calendar-test.py`:

```python
def test_job_skips_when_the_endpoint_is_not_configured(monkeypatch, caplog):
    from v1.jobs import refresh_member_calendar as job
    monkeypatch.setattr(job, "MEDLEM_EVENTS_URL", None)
    with caplog.at_level("WARNING"):
        job.refresh_member_calendar()
    assert "not configured" in caplog.text
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -k "job_skips" -p no:cacheprovider
```

Expected: `AttributeError` — the job module still imports `IPS_SSH_HOST`.

- [ ] **Step 3: Point the job's guard at the new settings**

In `backend/v1/jobs/refresh_member_calendar.py` replace the import and the guard:

```python
from v1.env_constants import MEDLEM_EVENTS_URL, MEDLEM_EVENTS_API_KEY
```

```python
    if not MEDLEM_EVENTS_URL or not MEDLEM_EVENTS_API_KEY:
        logger.warning(
            "Member calendar not configured (MEDLEM_EVENTS_URL/MEDLEM_EVENTS_API_KEY), skipping sync")
        return
```

and change the log line below from "over SSH tunnel" to "from the member site endpoint".

- [ ] **Step 4: Run it**

```bash
cd backend && python -m pytest __tests__/member_calendar-test.py -k "job_skips" -p no:cacheprovider
```

Expected: PASS.

- [ ] **Step 5: Drop the dependencies**

Delete these two lines from `backend/v1/requirements.txt`:

```
pymysql # MySQL driver for IPS calendar sync
sshtunnel>=0.5.1 # SSH tunnel for remote DB access. 0.4.0 uses paramiko.DSSKey, which paramiko 4.0 removed
```

Confirm nothing else imports them:

```bash
grep -rn "pymysql\|sshtunnel" backend/ --include=*.py
```

Expected: no output.

- [ ] **Step 6: Replace the compose settings**

In `docker-compose.yml`, replace lines 40-47 (the eight `IPS_*` entries) with:

```yaml
      MEDLEM_EVENTS_URL: ${MEDLEM_EVENTS_URL}
      MEDLEM_EVENTS_API_KEY: ${MEDLEM_EVENTS_API_KEY}
```

- [ ] **Step 7: Run the whole suite and commit**

```bash
cd backend && python -m pytest -p no:cacheprovider -q
cd .. && git commit -m "Drop the SSH tunnel path to the member calendar" -- \
  backend/v1/jobs/refresh_member_calendar.py backend/v1/requirements.txt \
  docker-compose.yml backend/__tests__/member_calendar-test.py
```

---

## Task 7: Documentation

Documentation that still describes the tunnel is worse than none — people act on it.

**Files:**
- Modify: `backend/v1/member_calendar/README.md`
- Modify: `docs/EventsUnified.md`

- [ ] **Step 1: Rewrite the member calendar README**

Three things change. The opening paragraph: we read the member site through an endpoint we run there, not through its database, and the reason is that the tunnel needed a key and a database password in every environment and so only ever ran in development. The **Source** entry in the architecture list: `ips_source.py` fetches JSON from `medlem-api/events.php` and maps it; the SQL lives in that PHP file now. The **Configuration** block, which becomes:

```bash
MEDLEM_EVENTS_URL=https://medlem.mensa.se/swagapp/events.php
MEDLEM_EVENTS_API_KEY=***

# Job configuration (optional)
SYNC_MEMBER_CALENDAR_ENABLED=true
SYNC_MEMBER_CALENDAR_PERIOD=1800  # seconds (30 minutes)
```

Add a line pointing at `medlem-api/README.md` for the endpoint's own installation, and keep the Event ID Format and Storage sections as they are — neither changed.

- [ ] **Step 2: Update `docs/EventsUnified.md`**

Read it first and correct whatever it says about how calendar events arrive. Change nothing else.

- [ ] **Step 3: Check the docs against the code one last time**

Every environment variable named in either document must exist in `env_constants.py`, and every file path named must exist. Check them by hand — a document naming a setting that was renamed is the failure this step exists to catch.

- [ ] **Step 4: Commit and push**

```bash
git commit -m "Document the member calendar HTTP source" -- \
  backend/v1/member_calendar/README.md docs/EventsUnified.md
git pull --rebase
git push
git status   # must read "up to date with origin"
```

---

## Task 8: Verify at the consumer

A change is done when the thing that needs it has it. The endpoint answering curl is not the finish line; the backend holding the events is.

- [ ] **Step 1: Run the sync against the live endpoint**

With `MEDLEM_EVENTS_URL` and `MEDLEM_EVENTS_API_KEY` set in the environment:

```bash
cd backend && python -c "
from v1.jobs.refresh_member_calendar import refresh_member_calendar
refresh_member_calendar()
"
```

Expected in the log: a row count near 4932, then a stored count close to it.

- [ ] **Step 2: Read the events back out of the database**

```bash
cd backend && python -c "
from v1.member_calendar.calendar_db import get_all_member_calendar_events
events = get_all_member_calendar_events()
print(len(events))
print(events[0].name, events[0].start, events[0].extras.get('region'))
"
```

Expected: a count matching the sync, a real Swedish event title, and a region like `nord` or `stockholm`.

- [ ] **Step 3: Confirm the events reach the app's events feed**

The unified feed is what the app renders. Fetch it from a running backend and confirm calendar-sourced events appear with `cal`-prefixed ids. If the app's events screen can be opened against this backend, open it and look.

- [ ] **Step 4: Close the task and tell Jenny**

```
task_close swagapp SWAGAPP-505
chat_tell_jenny "..."
```

---

## Open questions

Asked in chat on 2026-11-14, unanswered when this plan was written. Task 4 waits on the first; the rest are written the way the answer below says, and are cheap to change.

1. **How the file reaches the web root** — an administrator places it, or they symlink a directory in `/home/pontus` into the web root so we can deploy over SSH. Written assuming a `swagapp/` directory under the web root either way.
2. **Whether the SSH tunnel path goes** — this plan removes it. If the answer is "keep both", stop at Task 5, leave `pymysql`, `sshtunnel` and the `IPS_*` settings in place, and choose between the two sources on whether `MEDLEM_EVENTS_URL` is set.
3. **Whether organiser names may come through** — answered: yes, and Mikael asked for the Mensa membership number alongside, so the organiser can be matched to their profile in the app. `core_members.mensa_id` holds it, populated for 8789 of 8799 members. Task 5a carries it into the model.
