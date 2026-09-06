#!/bin/bash
#
# Copy a SWAG deployment's data from one Kubernetes namespace to another
# (for example production → staging): the PostgreSQL database and the
# backend's uploaded images under /static/img.
#
# DESTRUCTIVE. Everything in the destination database is replaced.
#
# The dump is streamed through kubectl rather than staged inside the pod, so
# nothing is written to the database volume and there is nothing to clean up.

set -euo pipefail

# Label selector for the Postgres pod. Override if the chart labels differ:
#   POSTGRES_SELECTOR=app.kubernetes.io/name=postgresql ./tools/migrate.sh
POSTGRES_SELECTOR="${POSTGRES_SELECTOR:-app=postgres}"
BACKEND_SELECTOR="${BACKEND_SELECTOR:-app=backend}"

# Credentials are read from the pod's own environment at exec time, so they
# never appear in this file, in the process list, or in shell history.
PG_USER_EXPR='${POSTGRES_USER:-swag}'
PG_DB_EXPR='${POSTGRES_DB:-swag}'

find_pod() {
    local namespace=$1 selector=$2
    kubectl -n "$namespace" get pods -l "$selector" \
        --field-selector=status.phase=Running \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null
}

# Function to select namespace
select_namespace() {
    local purpose=$1  # "source" or "destination"
    while true; do
        echo -e "\nAvailable namespaces:"
        echo "--------------------"

        # Get namespaces into an array using basic shell commands
        local i=0
        declare -a namespaces
        while IFS= read -r ns; do
            if [ "$ns" != "NAME" ]; then
                namespaces[$i]="$ns"
                printf "%3d) %s\n" $((i+1)) "$ns"
                i=$((i+1))
            fi
        done < <(kubectl get namespaces -o custom-columns=":metadata.name")

        echo -e "\nSelect ${purpose} namespace (or 'q' to quit):"
        read -p "Enter number: " selection

        # Check for quit
        if [[ "$selection" == "q" ]]; then
            echo "Operation cancelled by user"
            exit 0
        fi

        # Validate input is a number
        if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
            echo "Please enter a valid number"
            continue
        fi

        # Adjust for 0-based array indexing
        index=$((selection-1))

        # Check if selection is within range
        if [ "$index" -ge 0 ] && [ "$index" -lt "$i" ]; then
            selected_ns="${namespaces[$index]}"

            echo -e "\nChecking for PostgreSQL pod in $selected_ns..."
            if [ -n "$(find_pod "$selected_ns" "$POSTGRES_SELECTOR")" ]; then
                echo "✓ Found PostgreSQL pod in $selected_ns"
                return 0
            else
                echo "✗ No running PostgreSQL pod ($POSTGRES_SELECTOR) in $selected_ns"
                echo "Please select a different namespace"
                continue
            fi
        else
            echo "Invalid selection. Please choose a number between 1 and $i"
        fi
    done
}

require_pod() {
    local namespace=$1 selector=$2 label=$3
    local pod
    pod=$(find_pod "$namespace" "$selector")
    if [ -z "$pod" ]; then
        echo "Error: no running $label pod ($selector) in namespace $namespace" >&2
        exit 1
    fi
    echo "$pod"
}

select_namespace "source"
SOURCE_NS="$selected_ns"
SOURCE_PG_POD=$(require_pod "$SOURCE_NS" "$POSTGRES_SELECTOR" "PostgreSQL")
SOURCE_BACKEND_POD=$(require_pod "$SOURCE_NS" "$BACKEND_SELECTOR" "backend")

select_namespace "destination"
DEST_NS="$selected_ns"
DEST_PG_POD=$(require_pod "$DEST_NS" "$POSTGRES_SELECTOR" "PostgreSQL")
DEST_BACKEND_POD=$(require_pod "$DEST_NS" "$BACKEND_SELECTOR" "backend")

if [ "$SOURCE_NS" == "$DEST_NS" ]; then
    echo "Error: source and destination are the same namespace ($SOURCE_NS)" >&2
    exit 1
fi

# Confirm selection
echo -e "\nMigration Details:"
echo "-------------------"
echo "Source Namespace:        $SOURCE_NS"
echo "Source PostgreSQL Pod:   $SOURCE_PG_POD"
echo "Source Backend Pod:      $SOURCE_BACKEND_POD"
echo "Destination Namespace:   $DEST_NS"
echo "Destination PostgreSQL:  $DEST_PG_POD"
echo "Destination Backend Pod: $DEST_BACKEND_POD"
echo
echo "This REPLACES the entire database in '$DEST_NS'. It cannot be undone."
read -p "Type the destination namespace to confirm: " confirm
if [[ "$confirm" != "$DEST_NS" ]]; then
    echo "Migration cancelled"
    exit 0
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/swag_migration_${TIMESTAMP}"
IMAGES_DIR="${BACKUP_DIR}/static_images"
DUMP_FILE="${BACKUP_DIR}/swag.dump"

echo -e "\nStarting migration..."

# Create backup directories
mkdir -p "${IMAGES_DIR}"
echo "Created backup directory: ${BACKUP_DIR}"

# Step 1: Copy static images from source backend
echo "Copying static images from source backend..."
kubectl -n "${SOURCE_NS}" cp "${SOURCE_BACKEND_POD}:/static/img" "${IMAGES_DIR}"

# Step 2: Dump the source database.
# -Fc is the custom format: compressed, and restorable with --clean.
echo "Dumping source database..."
kubectl -n "${SOURCE_NS}" exec "${SOURCE_PG_POD}" -- \
    sh -c "pg_dump -U ${PG_USER_EXPR} -d ${PG_DB_EXPR} -Fc --no-owner --no-privileges" \
    > "${DUMP_FILE}"

if [ ! -s "${DUMP_FILE}" ]; then
    echo "Error: dump is empty — aborting before touching the destination" >&2
    rm -rf "${BACKUP_DIR}"
    exit 1
fi
echo "Dump written: $(du -h "${DUMP_FILE}" | cut -f1)"

# Step 3: Restore into the destination.
# --clean --if-exists drops each object before recreating it, so this replaces
# the previous contents without needing to drop the database itself (which
# would fail anyway while the backend holds connections open).
echo "Restoring into destination database..."
kubectl -n "${DEST_NS}" exec -i "${DEST_PG_POD}" -- \
    sh -c "pg_restore -U ${PG_USER_EXPR} -d ${PG_DB_EXPR} --clean --if-exists --no-owner --no-privileges" \
    < "${DUMP_FILE}"

# Step 4: Copy static images to destination backend
echo "Copying static images to destination backend pod..."
kubectl -n "${DEST_NS}" cp "${IMAGES_DIR}" "${DEST_BACKEND_POD}:/static/img"

# Step 5: Cleanup
echo "Cleaning up temporary files..."
rm -rf "${BACKUP_DIR}"

echo "Migration completed successfully!"
echo "Restart the backend in ${DEST_NS} so it reconnects, then verify the data and images."
