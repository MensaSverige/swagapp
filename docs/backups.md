# Backups

PostgreSQL is what production runs on, and it is backed up to Elastx Swift
object storage. It had no backup at all before 2026-10-28.

**State, 2026-11-14.** The PostgreSQL half is live and proven: `ObjectStore
swagapp-db-backup`, `ScheduledBackup swagapp-db-daily` at 03:00 UTC, and three
`Backup` objects in phase `completed`, the newest from this morning. The
MongoDB half below was built but never merged — the cutover finished first, the
backend has been PostgreSQL-only since v2.1.7.1, and the Mongo deployment is
idle and due to be retired. What it leaves behind is one pre-flip snapshot taken
by hand on 2026-10-28, `swagapp-mongodump-prod/manual/mongo-20261028T130838Z-first-snapshot.archive.gz`,
which is the only copy of the data as it stood before the flip. The Mongo
sections are kept for as long as restoring that object is a thing anyone might
need to do.

| | MongoDB | PostgreSQL |
|---|---|---|
| Mechanism | `CronJob mongo-backup` (`mongodump`) | CloudNativePG `barman-cloud` plugin |
| Container | `swagapp-mongodump-prod` | `swagapp-pgbackup-prod` |
| Cadence | daily 02:17 UTC, plus on demand | continuous WAL + daily base backup 03:00 UTC |
| Retention | **nothing is ever deleted** | 30 days |
| Granularity | whole-database snapshot | point in time, to the WAL |
| Manifests | `mongo-backup.yaml` on swagapp-ops branch `feat/backups`, never merged | `swagapp-ops/deployment/postgres-backup.yaml` on main |

PostgreSQL reads the Secret `swagapp-pgbackup-s3`, sealed on its own in
`swagapp-ops/deployment/pgbackup-s3-sealedsecret.yaml`. The Mongo job would have
read the same credential.

Mongo keeps every snapshot because the whole dataset compresses to about
290 KiB. A year of daily backups costs under 1 SEK a month, and no code path
can age out the pre-flip snapshot a rollback would need. PostgreSQL's 30 days
is barman's own retention and matches the rest of the fleet.

---

## The credential

`swagapp-pgbackup-s3` carries `S3_ACCESS_KEY` and `S3_SECRET_KEY`. It is sealed
directly into `deployment/pgbackup-s3-sealedsecret.yaml` rather than through the
**Update Secrets** workflow, because that workflow rebuilds `mensa-auth-keys`
wholesale from GitHub repository secrets and these two keys are not part of it.
It is a separate Secret on purpose:
every Swift S3 key reaches every project's containers in the fleet's single
Swift account, so this one gets revoked and replaced on its own schedule rather
than whenever an app secret changes.

To create or rotate it:

    grit swift secrets --bucket swagapp-pgbackup-prod --namespace swagapp --project swagapp

That mints the key pair and writes `S3_*` into the project's secret store
without printing the values. Then reseal the manifest that holds them:

    grit secret reseal-key --manifest deployment/pgbackup-s3-sealedsecret.yaml --add

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

There is no `mongo-backup` CronJob in the cluster, so this needs the manifests on
the unmerged `feat/backups` branch applied first. The commands below are what
they give you, and they are what produced the one snapshot that exists:

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
gone. If you are unsure which you want, restore into a throwaway Mongo first and look
at the data.

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

- **Nothing copies PostgreSQL back to MongoDB.** Rolling back to Mongo now loses
  everything members have written since the flip, which is weeks of it. The
  snapshot is a record of the old data, not a way back.
- **MongoDB is not backed up on a schedule.** It holds nothing current and is
  due for retirement; the one 2026-10-28 snapshot is all there is.
- **The backend's own volume** (`swagapp-backend`, 10Gi) is not backed up. It
  holds no database; check before assuming anything on it matters.
- **Swift itself is one account in one region.** These backups survive losing a
  volume, a node or the cluster. They do not survive losing the Elastx account.
