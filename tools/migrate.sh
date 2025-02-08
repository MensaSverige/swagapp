#!/bin/bash

# Exit on any error
set -e

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
            
            # Verify MongoDB pod exists in selected namespace
            if [ "$purpose" == "source" ] || [ "$purpose" == "destination" ]; then
                echo -e "\nChecking for MongoDB pod in $selected_ns..."
                if kubectl -n "$selected_ns" get pods -l app=mongo -o name >/dev/null 2>&1; then
                    echo "✓ Found MongoDB pod in $selected_ns"
                    return 0
                else
                    echo "✗ No MongoDB pod found in $selected_ns"
                    echo "Please select a different namespace"
                    continue
                fi
            fi
            
            return 0
        else
            echo "Invalid selection. Please choose a number between 1 and $i"
        fi
    done
}

# Function to find MongoDB pod in namespace
find_mongo_pod() {
    local namespace=$1
    local mongo_pod=$(kubectl -n "$namespace" get pods -l app=mongo -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$mongo_pod" ]; then
        echo "No MongoDB pod found in namespace $namespace"
        return 1
    fi
    
    echo "Found MongoDB pod: $mongo_pod"
    return 0
}

# Function to find backend pod in namespace
find_backend_pod() {
    local namespace=$1
    local backend_pod=$(kubectl -n "$namespace" get pods -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$backend_pod" ]; then
        echo "No backend pod found in namespace $namespace"
        return 1
    fi
    
    echo "Found backend pod: $backend_pod"
    return 0
}

select_namespace "source"
SOURCE_NS="$selected_ns"
if ! find_mongo_pod "$SOURCE_NS"; then
    echo "Error: No MongoDB pod found in source namespace"
    exit 1
fi
SOURCE_MONGO_POD=$(kubectl -n "$SOURCE_NS" get pods -l app=mongo -o jsonpath='{.items[0].metadata.name}')

if ! find_backend_pod "$SOURCE_NS"; then
    echo "Error: No backend pod found in source namespace"
    exit 1
fi
SOURCE_BACKEND_POD=$(kubectl -n "$SOURCE_NS" get pods -l app=backend -o jsonpath='{.items[0].metadata.name}')

select_namespace "destination"
DEST_NS="$selected_ns"
if ! find_mongo_pod "$DEST_NS"; then
    echo "Error: No MongoDB pod found in destination namespace"
    exit 1
fi
DEST_MONGO_POD=$(kubectl -n "$DEST_NS" get pods -l app=mongo -o jsonpath='{.items[0].metadata.name}')

if ! find_backend_pod "$DEST_NS"; then
    echo "Error: No backend pod found in destination namespace"
    exit 1
fi
DEST_BACKEND_POD=$(kubectl -n "$DEST_NS" get pods -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Confirm selection
echo -e "\nMigration Details:"
echo "-------------------"
echo "Source Namespace: $SOURCE_NS"
echo "Source MongoDB Pod: $SOURCE_MONGO_POD"
echo "Source Backend Pod: $SOURCE_BACKEND_POD"
echo "Destination Namespace: $DEST_NS"
echo "Destination MongoDB Pod: $DEST_MONGO_POD"
echo "Destination Backend Pod: $DEST_BACKEND_POD"
read -p "Proceed with migration? (y/n): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/mongo_migration_${TIMESTAMP}"
IMAGES_DIR="${BACKUP_DIR}/static_images"

echo -e "\nStarting migration..."

# Create backup directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "${IMAGES_DIR}"
echo "Created backup directories: ${BACKUP_DIR} and ${IMAGES_DIR}"

# Step 1: Copy static images from source backend
echo "Copying static images from source backend..."
kubectl -n ${SOURCE_NS} cp ${SOURCE_BACKEND_POD}:/static/img "${IMAGES_DIR}"

# Step 2: Dump data from source MongoDB
echo "Dumping data from source MongoDB..."
kubectl -n ${SOURCE_NS} exec ${SOURCE_MONGO_POD} -- mongodump --out /data/db/backup
echo "Creating tar archive of the backup..."
kubectl -n ${SOURCE_NS} exec ${SOURCE_MONGO_POD} -- tar -czf /data/db/backup.tar.gz -C /data/db backup
echo "Copying backup from source pod..."
kubectl -n ${SOURCE_NS} cp ${SOURCE_MONGO_POD}:/data/db/backup.tar.gz "${BACKUP_DIR}/backup.tar.gz"

# Step 3: Copy backup to destination pod and extract
echo "Copying backup to destination MongoDB pod..."
kubectl -n ${DEST_NS} cp "${BACKUP_DIR}/backup.tar.gz" ${DEST_MONGO_POD}:/data/db/backup.tar.gz

echo "Extracting backup on destination pod..."
kubectl -n ${DEST_NS} exec ${DEST_MONGO_POD} -- tar -xzf /data/db/backup.tar.gz -C /data/db

# Step 4: Drop existing database and restore backup
echo "Dropping existing database in destination..."
kubectl -n ${DEST_NS} exec ${DEST_MONGO_POD} -- mongosh --eval 'db.getMongo().getDB("swag").dropDatabase()'

echo "Restoring MongoDB backup..."
kubectl -n ${DEST_NS} exec ${DEST_MONGO_POD} -- mongorestore /data/db/backup

# Step 5: Copy static images to destination backend
echo "Copying static images to destination backend pod..."
kubectl -n ${DEST_NS} cp "${IMAGES_DIR}" ${DEST_BACKEND_POD}:/static/img

# Step 6: Cleanup
echo "Cleaning up temporary files..."
kubectl -n ${DEST_NS} exec ${DEST_MONGO_POD} -- rm -rf /data/db/backup /data/db/backup.tar.gz
kubectl -n ${SOURCE_NS} exec ${SOURCE_MONGO_POD} -- rm -rf /data/db/backup /data/db/backup.tar.gz
rm -rf "${BACKUP_DIR}"

echo "Migration completed successfully!"
echo "Please verify the data and images in the new deployment."