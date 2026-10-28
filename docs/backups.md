# Backups

Production holds two databases during the PostgreSQL cutover, and both are
backed up to Elastx Swift object storage. MongoDB is the cutover's rollback
path; PostgreSQL is what the app runs on afterwards. Neither had a backup
before 2026-10-28.

| | MongoDB | PostgreSQL |
|---|---|---|
| Mechanism | `CronJob mongo-backup` (`mongodump`) | CloudNativePG `barman-cloud` plugin |
| Container | `swagapp-mongodump-prod` | `swagapp-pgbackup-prod` |
| Cadence | daily 02:17 UTC, plus on demand | continuous WAL + daily base backup 03:00 UTC |
| Retention | **nothing is ever deleted** | 30 days |
| Granularity | whole-database snapshot | point in time, to the WAL |
| Manifests | `swagapp-ops/deployment/mongo-backup.yaml` | `swagapp-ops/deployment/postgres-backup.yaml` |

Both read the same credential, the Secret `swagapp-backup-s3`.

Mongo keeps every snapshot because the whole dataset compresses to about
290 KiB. A year of daily backups costs under 1 SEK a month, and no code path
can age out the pre-flip snapshot a rollback would need. PostgreSQL's 30 days
is barman's own retention and matches the rest of the fleet.

---

## The credential

`swagapp-backup-s3` carries `S3_ACCESS_KEY` and `S3_SECRET_KEY`, sealed from
GitHub repository secrets of the same names by the **Update Secrets** workflow
in `swagapp-ops`. It is a separate Secret from `mensa-auth-keys` on purpose:
every Swift S3 key reaches every project's containers in the fleet's single
Swift account, so this one gets revoked and replaced on its own schedule rather
than whenever an app secret changes.

To create or rotate it:

    grit swift secrets --bucket swagapp-pgbackup-prod --namespace swagapp --project swagapp

That mints the key pair and writes `S3_*` into the project's secret store
without printing the values. Put `S3_ACCESS_KEY` and `S3_SECRET_KEY` into the
`swagapp-ops` repository secrets, then run **Actions → Update Secrets**, which
reseals both Secrets and commits `deployment/backup-secrets.yaml`.

**Never paste an S3 key into a task, a chat message or a log.** A leaked one is
a fleet-wide incident, not a swagapp one: revoke it with
`grit swift delete-s3-key <access-id>` rather than reasoning about its scope.

---

## Proving a backup exists

A green config is not a backup. A fleet audit in August 2026 found 27
CloudNativePG databases that had never produced one while every surface
reported healthy.

**MongoDB** — ask the object store what it holds:

    grit swift ls swagapp-mongodump-prod

Each object is `mongo-<timestamp>-<pod>.archive.gz`. The pod name is in the key
so an object traces back to the run that wrote it, and a hand-made run stands
out. The job's own log is the other half:

    kubectl -n swagapp logs job/<the job> -c upload
    # upload.sh: s3://swagapp-mongodump-prod/mongo-... ok (289477 bytes)

That line means the object was read back from Swift after the upload, not just
that the CLI exited 0.

**PostgreSQL** — the only evidence is a `Backup` in phase `completed`:

    kubectl -n swagapp get backup
    kubectl -n swagapp get cluster swagapp-db -o jsonpath='{.status.conditions}'

Look for `ContinuousArchiving` True and `LastBackupSucceeded` True. A
`ScheduledBackup` that exists, or an `ObjectStore` that is Synced, proves
nothing.

And the stronger check, which restores the backup and counts rows in it:

    grit db drill --namespace swagapp --cluster swagapp-db

The tables it counts are declared on the `Cluster` as
`grit.gronitab/drill-tables`. A restore that comes back with those empty is a
failed restore.

---

## Backing up MongoDB on demand

Before anything irreversible — the cutover above all — take a snapshot by hand.
It runs the same scripts as the nightly job, so there is one mechanism and
nothing to keep in step:

    kubectl -n swagapp create job --from=cronjob/mongo-backup mongo-backup-preflip
    kubectl -n swagapp wait --for=condition=complete job/mongo-backup-preflip --timeout=5m
    kubectl -n swagapp logs job/mongo-backup-preflip -c upload

The job name becomes part of the object key, so name it after why you took it.
Confirm it landed with `grit swift ls swagapp-mongodump-prod` before carrying
on. It takes a couple of seconds; the dataset is small.

---

## Restoring MongoDB

The archive is a plain `mongodump --archive --gzip`, so `mongorestore` reads it
with no tooling of ours in the way.

    # 1. Pick the snapshot.
    grit swift ls swagapp-mongodump-prod

    # 2. Fetch it. The URL is itself a credential — capture it, do not paste it.
    URL=$(grit swift temp-url swagapp-mongodump-prod/<object> --method GET --ttl 15m)
    curl -fsSL -o restore.archive.gz "$URL"

    # 3. Put it in the Mongo pod.
    POD=$(kubectl -n swagapp get pod -l app=mongo -o jsonpath='{.items[0].metadata.name}')
    kubectl -n swagapp cp restore.archive.gz "$POD:/tmp/restore.archive.gz"

    # 4. Read it back before writing anything. This parses the whole archive.
    kubectl -n swagapp exec "$POD" -- mongorestore --uri mongodb://localhost:27017 \
      --archive=/tmp/restore.archive.gz --gzip --dryRun

    # 5. Restore. --drop replaces each collection rather than merging into it.
    kubectl -n swagapp exec "$POD" -- mongorestore --uri mongodb://localhost:27017 \
      --archive=/tmp/restore.archive.gz --gzip --drop

    kubectl -n swagapp exec "$POD" -- rm /tmp/restore.archive.gz

**`--drop` is the point and also the risk.** It discards whatever is in those
collections now. Without it, a restore merges old documents into current ones
and you get neither state. With it, anything written since the snapshot is
gone. If you are unsure which you want, restore into a throwaway Mongo first
("Rehearse it against a real dump first" in
[postgres-cutover.md](postgres-cutover.md)) and look at the data.

Restoring to a **different** database or a scratch instance is the same command
with `--uri` pointed elsewhere; nothing in the archive pins it to this cluster.

---

## Restoring PostgreSQL

CloudNativePG never restores in place. You create a **new** `Cluster` that
bootstraps from the object store, check it, and then move the application onto
it. The original is left alone, which is what makes this safe to try.

    apiVersion: postgresql.cnpg.io/v1
    kind: Cluster
    metadata:
      name: swagapp-db-restore
      namespace: swagapp
    spec:
      instances: 1
      imageName: ghcr.io/cloudnative-pg/postgresql:16
      storage:
        size: 5Gi
        storageClass: v2-16k
      bootstrap:
        recovery:
          source: swagapp-db-origin
          # Omit to recover to the latest WAL; set it to go back in time.
          # recoveryTarget:
          #   targetTime: "2026-10-28 13:00:00+00"
      externalClusters:
        - name: swagapp-db-origin
          plugin:
            name: barman-cloud.cloudnative-pg.io
            parameters:
              barmanObjectName: swagapp-db-backup
              serverName: swagapp-db

`serverName` must be the **original** cluster's name, because that is the
prefix the backups were written under. Apply it by hand, never commit it: a
restore cluster left in git becomes a second database that ArgoCD keeps alive.

`grit db drill` does all of this and tears it down afterwards, so prefer it for
a rehearsal and keep the manifest above for a real recovery, where you want the
restored cluster to stay.

---

## What is not covered

- **Nothing copies PostgreSQL back to MongoDB.** After the cutover, rollback to
  Mongo loses whatever members wrote to PostgreSQL. That window is the cutover's
  real risk, not the backups.
- **The backend's own volume** (`swagapp-backend`, 10Gi) is not backed up. It
  holds no database; check before assuming anything on it matters.
- **Swift itself is one account in one region.** These backups survive losing a
  volume, a node or the cluster. They do not survive losing the Elastx account.
