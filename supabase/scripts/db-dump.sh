#!/bin/bash

# Script to dump local or remote Supabase schema
# Usage: ./db-dump.sh [local|remote]

set -e

# Default to local if no argument provided
MODE=${1:-local}

# Create schema directory if it doesn't exist
SCHEMA_DIR="$(dirname "$0")/../schema"
mkdir -p "$SCHEMA_DIR"

# Generate timestamp for file naming
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

case "$MODE" in
  local)
    echo "Dumping local Supabase schema..."
    OUTPUT_FILE="$SCHEMA_DIR/local_schema_${TIMESTAMP}.sql"
    
    # Dump local database schema
    supabase db dump --local -f "$OUTPUT_FILE"
    
    # Also create a latest symlink
    ln -sf "local_schema_${TIMESTAMP}.sql" "$SCHEMA_DIR/local_schema_latest.sql"
    
    echo "✅ Local schema dumped to: $OUTPUT_FILE"
    ;;
    
  remote)
    echo "Dumping remote Supabase schema..."
    OUTPUT_FILE="$SCHEMA_DIR/remote_schema_${TIMESTAMP}.sql"
    
    # Dump remote database schema (requires being linked to a project)
    supabase db dump -f "$OUTPUT_FILE"
    
    # Also create a latest symlink
    ln -sf "remote_schema_${TIMESTAMP}.sql" "$SCHEMA_DIR/remote_schema_latest.sql"
    
    echo "✅ Remote schema dumped to: $OUTPUT_FILE"
    ;;
    
  *)
    echo "❌ Invalid mode: $MODE"
    echo "Usage: $0 [local|remote]"
    echo "  local  - Dump schema from local Supabase instance"
    echo "  remote - Dump schema from linked remote Supabase project"
    exit 1
    ;;
esac

# Show file size
echo "📊 File size: $(du -h "$OUTPUT_FILE" | cut -f1)"

# Optional: Clean up old dumps (keep last 5)
echo "🧹 Cleaning up old dumps..."
cd "$SCHEMA_DIR"
ls -t *_schema_*.sql 2>/dev/null | grep -v latest | tail -n +6 | xargs -r rm -v

echo "✨ Done!"