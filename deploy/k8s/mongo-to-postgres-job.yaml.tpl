# One-time MongoDB -> PostgreSQL data migration.
#
# Commit into swagapp-ops/deployment/ and the release pipeline substitutes VERSION.
# A Job is immutable once created, so GitOps applying this repeatedly still runs it
# exactly once — delete the Job object when you want it to run again.
#
# To run it directly instead, reuse the image the backend is already running rather
# than building the tag by hand. The pipeline publishes "<git tag>.<short sha>"
# (e.g. v1.4.0.a1b2c3d), so VERSION is not simply the release tag:
#
#   IMAGE=$(kubectl -n <ns> get deploy <backend-deploy> #             -o jsonpath='{.spec.template.spec.containers[0].image}')
#   sed "s|ghcr.io/mensasverige/swagapp/backend:VERSION|$IMAGE|" #     mongo-to-postgres-job.yaml.tpl | kubectl -n <ns> apply -f -
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
  # NOT set on purpose. ttlSecondsAfterFinished deletes the Job object once it
  # finishes — and if this manifest lives in GitOps, the next sync after that
  # would recreate it and run the migration again. Harmless for the data (the
  # writes are idempotent) but it fails once Mongo is decommissioned, turning a
  # green sync red for a migration that should never run twice.
  #
  # Delete the Job by hand after the cutover instead:
  #   kubectl -n <ns> delete job swag-mongo-to-postgres
  # ttlSecondsAfterFinished: 86400
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
            # Source. The old backend connected to host "mongo" on 27017,
            # so this should match the existing Service name.
            - name: MONGO_URL
              value: "mongodb://mongo:27017"
            # Destination. Must be the same value the backend Deployment uses.
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: swag-postgres
                  key: DATABASE_URL
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 1Gi
