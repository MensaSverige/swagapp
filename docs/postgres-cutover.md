# MongoDB → PostgreSQL cutover

The backend no longer speaks MongoDB. `main` runs on PostgreSQL, but **no production
data has moved yet** — that is a manual, one-time step, and it has to happen before
the next release reaches users.

**Do not cut a `v*` release tag until step 1 is done.** Tagging is what triggers
`on-release-tag.yml` → GHCR → `swagapp-ops`. Merging to `main` deploys nothing, so
there is no time pressure. A release before step 1 is a full outage: the backend
cannot reach a database, fails at startup, and crash-loops. A release after step 1
but without step 3 comes up against an empty database, and every member sees an
empty app.

Written for whoever owns the cluster and `mensasverige/swagapp-ops`. Names are from
`swagapp-ops/deployment/`: namespace `swagapp`, backend Deployment `backend`, Mongo
Service `mongo` on 27017.

---

## What changed

| | Before | After |
|---|---|---|
| Database | MongoDB | PostgreSQL 16 |
| Connection | hardcoded `MongoClient('mongo', 27017)` | `DATABASE_URL` env var |
| Schema | implicit (schemaless) | Alembic migrations, applied automatically at startup |
| Driver | `pymongo` | `psycopg2-binary` |

The connection detail matters: there was **no env var before**, so `DATABASE_URL` is
new configuration that must be added to the backend Deployment. Its default is
`postgresql://swag:swag@postgres:5432/swag` — local dev credentials. If the variable
is missing in the cluster, the backend tries a host called `postgres` and retries for
about 30 seconds. Then `initialize_db failed after 5 attempts` is logged, the
server never loads, and the pod crash-loops.

**Schema creation is automatic.** `initialize_db()` runs on every boot and applies
Alembic migrations. You only need to provide an empty database and a user that can
create tables — do not hand-create the schema.

---

## 1. Provision (before the release)

Production PostgreSQL is an in-cluster CloudNativePG `Cluster`, so there is no
Postgres Deployment, Service, PVC or hand-made Secret to write. The operator creates
the volumes, the read-write Service `swagapp-db-rw`, and a `swagapp-db-app` Secret
whose `uri` key is the full connection URL. The backend and the migration Job both
read `DATABASE_URL` from that key, so the names below have to match exactly.

- [ ] **A `postgresql.cnpg.io/v1` `Cluster` named `swagapp-db`** in namespace
      `swagapp`. Follow the fleet's existing examples:
      - `instances: 3`, spread one per zone (sto1/sto2/sto3) with a
        `topologySpreadConstraint` on `topology.kubernetes.io/zone`.
      - PostgreSQL 16 to match dev, e.g. `imageName: ghcr.io/cloudnative-pg/postgresql:16`.
      - The annotation `argocd.argoproj.io/sync-options: Prune=false`, so ArgoCD can
        never prune a live database.

      Schema creation is automatic (see above), so the default `bootstrap.initdb`
      app database and owner are enough.
- [ ] **Wait until it is healthy and the Secret exists:**

      kubectl -n swagapp get cluster swagapp-db       # STATUS: Cluster in healthy state
      kubectl -n swagapp get secret swagapp-db-app    # must exist, with a uri key

- [ ] **Backups.** A green `ScheduledBackup` proves nothing on its own. A backup only
      counts once a `Backup` object reaches phase `completed`.
- [ ] **Add `DATABASE_URL` to `deployment/backend-deployment.yaml.tpl`** in
      `swagapp-ops`. Edit the `.tpl`, not the rendered `.yaml`: every release
      regenerates the `.yaml` from the `.tpl`. ArgoCD only reads the `.yaml`, so this
      goes live with the release and not before, and older images ignore it.

          - name: DATABASE_URL
            valueFrom:
              secretKeyRef:
                name: swagapp-db-app
                key: uri

- [ ] **Make sure the `.tpl` files carry the June HA changes.** The `strategy:
      Recreate`, resources, anti-affinity and tolerations on the backend, and the 2
      replicas, rolling strategy and spread on the website, were added only to the
      rendered `.yaml` files. Unless the templates have them, this release silently
      reverts them all. Without `Recreate`, the backend rollout can stall on its RWO
      volume. To check, render each template with the current tag and diff it
      against its `.yaml`; nothing but the image tag should differ.
- [ ] **Leave MongoDB running.** It is the migration source and the rollback path.
      Do not delete it, its PVC, or its Service until step 5.

---

## 2. Release

Cut the `v*` tag as usual. The backend starts, connects to the empty PostgreSQL, and
applies migrations `001` and `002` automatically.

Expected in the logs:

    INFO [alembic.runtime.migration] Running upgrade  -> 001, Initial schema
    INFO [alembic.runtime.migration] Running upgrade 001 -> 002, Add tags column to user_events
    INFO:root:Ensuring review users exist.
    INFO:root:Server started at ...

At this point the app is up but **empty apart from two review accounts**. Members will
see no events and no profiles. Keep the window between this and step 3 short.

---

## 3. Run the migration

### Why this is not automatic

Schema migrations already are: `initialize_db()` applies Alembic on every boot, so a
release never needs a manual schema step. This is different — it is a **one-time data
transfer** out of a database that is about to be deleted. Wiring it into every release
would make every future deploy depend on MongoDB still existing, and it would start
failing the day Mongo is decommissioned.

**Apply it by hand, and do not commit the Job to `swagapp-ops/deployment/`.**
`update-gitops.yml` re-renders every `*.yaml.tpl` in that directory with each
release's image tag. A committed Job would get a new image on every later release.
A Job's pod template is immutable, so ArgoCD's sync would fail from then on, on every
release.

### Running it

The job needs to reach **both** databases at once, so run it while Mongo is still up.
Use the image the backend is already running. The published tag is
`<git tag>.<short sha>` (e.g. `v1.4.0.a1b2c3d`), not the bare release tag:

    IMAGE=$(kubectl -n swagapp get deploy backend \
      -o jsonpath='{.spec.template.spec.containers[0].image}')
    sed "s|ghcr.io/mensasverige/swagapp/backend:VERSION|$IMAGE|" \
      deploy/k8s/mongo-to-postgres-job.yaml.tpl | kubectl -n swagapp apply -f -

    kubectl -n swagapp logs -f job/swag-mongo-to-postgres

The manifest is in this repo at [`deploy/k8s/mongo-to-postgres-job.yaml.tpl`](../deploy/k8s/mongo-to-postgres-job.yaml.tpl).
It uses the same backend image, so no separate build, and needs no editing. It reads
`DATABASE_URL` from `swagapp-db-app`/`uri`, the same Secret as the backend. Its
`MONGO_URL` (`mongodb://mongo:27017`) matches the Service in `swagapp-ops`.

**Re-running is safe.** All writes are upserts (`ON CONFLICT`), and user events are
tracked in a `_mongo_migration_log` table keyed by Mongo ObjectId, so a second run
does not duplicate anything.

### Reading the outcome

The job migrates, in order: users → token storage → user events (plus hosts,
attendees, reports) → external events (plus admins, categories) → external root →
external event bookings. Then it compares row counts against Mongo.

- **Exit 0**, ending `Migration complete. All row counts match.` → done.
- **Exit 1**, ending `Migration completed with mismatches` → the counts disagree.
  Do not proceed. The log names the collection; capture it before retrying.

If the job appears to stall for ~30s and then fails with a server-selection error,
`MONGO_URL` is wrong or Mongo is unreachable from that namespace.

---

## 4. Verify

    DB=$(kubectl -n swagapp get secret swagapp-db-app -o jsonpath='{.data.dbname}' | base64 -d)
    kubectl -n swagapp exec -it swagapp-db-1 -- psql -d "$DB"

`swagapp-db-1` is the first CNPG instance. Any instance can answer these reads.

- [ ] `SELECT version_num FROM alembic_version;` → **`002`**
- [ ] `\dt` → **16 tables**: alembic_version, event_attendees, event_hosts,
      event_reports, event_suggested_hosts, external_event_admins,
      external_event_bookings, external_event_categories, external_event_details,
      external_root, external_root_dates, feedback_user_index, feedback_votes,
      token_storage, user_events, users
- [ ] `SELECT count(*) FROM users;` → matches the Mongo `user` collection
- [ ] `SELECT count(*) FROM user_events;` → matches `userevent`

Then in the app:

- [ ] Log in as a real member — profile, not an empty shell
- [ ] The events list is populated, and **event times are correct, not an hour out**
- [ ] The map shows members who share their location
- [ ] Create an event, add tags, reopen it — tags persist

The event-times check is worth doing deliberately. Mongo stored naive timestamps meaning
Swedish local time; PostgreSQL stores real instants. The migration localizes them on
the way in, so a 19:00 event stays 19:00. If everything is uniformly an hour early or
late, the migration ran from an outdated image — stop and say so.

---

## 5. After it is confirmed good

- [ ] Delete the Job: `kubectl -n swagapp delete job swag-mongo-to-postgres`
- [ ] **Keep MongoDB and its PVC for a while.** It is the only rollback path, and it
      costs nothing to leave running.
- [ ] Once you are confident, retire the Mongo Deployment, Service, and PVC — and
      `mongo-express` if it is still deployed.
- [ ] Back in this repo: remove `pymongo` from `backend/v1/requirements.txt`. It is
      there only so the shipped image can run this migration; nothing in `v1/`
      imports it.
- [ ] `tools/migrate.sh` (namespace-to-namespace copy, e.g. prod → staging) has been
      ported to `pg_dump`/`pg_restore`, but for a plain Postgres pod. It has not been
      tried against CloudNativePG: it would need
      `POSTGRES_SELECTOR=cnpg.io/cluster=swagapp-db`, and its `swag`/`swag`
      user and database defaults will not match. The cutover does not use it.

---

## Rollback

Before the migration, rollback is just redeploying the previous image — nothing has
changed in Mongo.

After the migration, Mongo is untouched by the process (the script only reads), so
rollback is still: redeploy the previous backend image, which reconnects to Mongo.
Anything members created in the PostgreSQL window would be lost, which is the reason
to keep step 2 → step 3 short.

---

## Rehearse it against a real dump first

This was rehearsed against seeded data before being written, and the rehearsal
found four things that would have gone wrong in production. Do the same with a
real `mongodump` — it is the only way to learn what your actual data contains.

    # restore a production dump into a throwaway Mongo on the app's network
    docker run -d --name dryrun-mongo --network swagapp_default --network-alias mongo mongo:7
    docker cp <dump-dir> dryrun-mongo:/dump && docker exec dryrun-mongo mongorestore /dump

    docker compose down -v && docker compose up -d      # empty Postgres
    docker compose exec backend sh -c \
      'cd /app && MONGO_URL=mongodb://mongo:27017 python -m migrations.mongo_to_postgres'

Then exercise the app against it — especially `GET /v1/users?show_location=true`,
because that endpoint fails as a whole if any single row is unreadable.

### What the rehearsal found

All four are fixed on `main`; they are listed so you know what the checks are for.

1. **`validate()` failed a correct migration.** It compared raw collection counts,
   but `_seed_review_users()` runs at every startup, so Postgres always holds rows
   the migration never created — and documents skipped for a missing `userId` make
   Mongo look bigger. It now compares migratable documents by key, and reports
   skips as warnings rather than failures. Without this you would have seen
   `exit 1` on a perfectly good run.

2. **Re-running duplicated every event report.** The tracking table stopped the
   parent `user_events` insert but execution fell through into the child loops.
   Hosts and attendees have unique constraints and absorbed it; `event_reports`
   does not. `backoffLimit: 2` on the Job made this reachable on any transient
   failure.

3. **Legacy privacy values 500'd the user list.** The rename
   (`ALL_MEMBERS` → `MEMBERS_ONLY`, etc.) was only applied to `show_location`.
   One migrated row with a legacy value in `show_profile` returned 500 for
   `GET /v1/users` — hiding every member from the map. The coercion now covers all
   fourteen privacy fields. Review caught that `show_email` and `show_phone` were
   still missing, because their own boolean validator did not handle strings.
   An unrecognised value falls back to `NO_ONE` rather than failing: if we cannot
   tell what someone chose, the safe reading of a privacy setting is the most
   restrictive one.

   The `NO_ONE` fallback only applies to reading. `PUT /v1/users/me` rejects an
   unrecognised value with a 422; otherwise a client typo would return 200 and
   silently save `NO_ONE` instead of what the member picked. It still accepts the
   legacy names, and booleans on `show_email`/`show_phone`. Each maps to exactly
   one current value, production accepts them today, and app builds from before
   the rename still send them.

4. **Retired interests 500'd it too.** `interests` is a strict enum of 79 values;
   Mongo holds whatever was valid when written. A single retired value failed the
   whole response. Unknown entries are now dropped.

Items 3 and 4 are the same failure shape as the `location_accuracy` bug: a list
response is all-or-nothing, so one unreadable row takes out the endpoint for
everyone. Expect more of that shape in real data, and check the user list
specifically.

### What it confirmed works

- Event times survive intact: Mongo held 19:00 Swedish local, PostgreSQL stores
  `2026-12-01 18:00:00+00`, and the API returns an instant that renders as 19:00
  in Stockholm. No hour drift.
- Legacy boolean `show_email` / `show_phone` coerce to `MEMBERS_ONLY` / `NO_ONE`.
- Locations without `accuracy` migrate and read back fine.
- Documents without a `userId` are skipped with a warning, not a crash.
- Re-running changes nothing: four consecutive runs left every row count identical.

---

## Settled in review

1. **Mongo Service:** `mongo`, port 27017, namespace `swagapp`, as the Job assumes.
2. **PostgreSQL:** in-cluster, via a CloudNativePG `Cluster` named `swagapp-db`.
   Step 1 and the Job are written against it.
3. **Job delivery:** one-off `kubectl apply`, never committed to `swagapp-ops`. See
   step 3 for why.
