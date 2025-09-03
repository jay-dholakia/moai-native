
#!/bin/bash

# Script to generate a migration by comparing schema.sql with current database state

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 migration_name [description]"
    echo "Example: $0 add_user_settings_table 'Adds a new table to store user settings'"
    exit 1
fi

MIGRATION_NAME=$1
DESCRIPTION="${2:-$MIGRATION_NAME}"

# Create timestamp with format YYYYMMDD_HHMMSS
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILE_NAME="${TIMESTAMP}_${MIGRATION_NAME}.sql"
FILE_PATH="supabase/migrations/$FILE_NAME"

# Create migrations directory if it doesn't exist
mkdir -p supabase/migrations
mkdir -p supabase/schemas/temp

echo "Generating migration by comparing current schema with database state..."

# Save current database state to temporary file
echo "Dumping current database structure..."
supabase db dump --local -f supabase/schemas/temp/current_schema.sql

# Generate a diff between schema.sql and current schema
if command -v pg_diff >/dev/null 2>&1; then
    echo "Creating migration from schema differences..."
    pg_diff supabase/schemas/schema.sql supabase/schemas/temp/current_schema.sql > "$FILE_PATH"
else
    echo "WARNING: pg_diff not found. Unable to automatically generate migration."
    echo "Please install pg_diff or manually create the migration file."
    
    # Create empty migration file with template
    cat > "$FILE_PATH" << EOF
-- Migration: $DESCRIPTION
-- Created at: $(date)

-- Write your migration SQL here manually
-- Diff tool was not available to auto-generate

EOF
fi

echo "Created migration file: $FILE_PATH"
echo "Review the generated migration before applying."

# Clean up
rm -rf supabase/schemas/temp

# Open the file in the default editor if possible
if command -v code >/dev/null 2>&1; then
    code "$FILE_PATH"
elif [ -n "$EDITOR" ]; then
    $EDITOR "$FILE_PATH"
fi
