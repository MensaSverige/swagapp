# One-time MongoDB -> PostgreSQL data migration.
#
# Apply it by hand, once. Do NOT commit it to swagapp-ops/deployment/:
# update-gitops.yml re-renders every *.yaml.tpl there with each release's image
# tag, so a committed Job would get a new image on every later release. A Job's
# pod template is immutable, so from then on every ArgoCD sync would fail.
#
# The running backend is still a Mongo build, so build the commit you are about
# to release without deploying it (Actions -> Build backend image), then:
#
#   sed "s|ghcr.io/mensasverige/swagapp/backend:VERSION|ghcr.io/mensasverige/swagapp/backend:build.<short sha>|" mongo-to-postgres-job.yaml.tpl | kubectl -n swagapp apply -f -
#
# Runbook, including when to run this relative to the release: docs/postgres-cutover.md
#
# Safe to re-run. Writes are upserts (ON CONFLICT) and user events are tracked
# in a _mongo_migration_log table, so a second run does not duplicate rows.
# The job fails loudly (exit 1) if any row count does not match afterwards.
apiVersion: batch/v1
kind: Job
metadata:
  name: swag-mongo-to-postgres
  labels:
    app: swag-migration
spec:
  # Idempotent, so a retry is safe — but two is enough to ride out a transient
  # connection failure without masking a real problem behind a retry loop.
  backoffLimit: 2
  # No ttlSecondsAfterFinished: keep the Job and its logs until the cutover is
  # verified, then delete it by hand (runbook step 5):
  #   kubectl -n swagapp delete job swag-mongo-to-postgres
  template:
    metadata:
      labels:
        app: swag-migration
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: ghcr.io/mensasverige/swagapp/backend:VERSION
          command: ["python", "-m", "migrations.mongo_to_postgres"]
          env:
            # Source: Service "mongo" in namespace swagapp, port 27017
            # (swagapp-ops/deployment/mongo-service.yaml).
            - name: MONGO_URL
              value: "mongodb://mongo:27017"
            # Destination: the app Secret CloudNativePG generates for the
            # swagapp-db Cluster, whose uri key is the full connection URL. The
            # backend Deployment reads the same key (runbook step 1).
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: swagapp-db-app
                  key: uri
          resources:
            # Matches the backend's request; the sto1 pool has run near full.
            # The migration is I/O-bound, so a small request costs little.
            requests:
              cpu: 50m
              memory: 256Mi
            limits:
              memory: 1Gi
