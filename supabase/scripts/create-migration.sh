
#!/bin/bash

# Script to create a new migration and update schema.sql

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

# Create the migration file with a template
cat > "$FILE_PATH" << EOF
-- Migration: $DESCRIPTION
-- Created at: $(date)

-- Write your migration SQL here

-- Don't forget to update schema.sql with the same changes to keep it as the source of truth
EOF

echo "Created migration file: $FILE_PATH"
echo "Edit this file to add your schema changes."
echo ""
echo "IMPORTANT: Remember to update schema.sql with the same changes!"
echo "After writing your migration, run:"
echo "  supabase db reset          # To apply locally"
echo "  supabase db push           # To apply to remote project"

# Open the file in the default editor if possible
if command -v code >/dev/null 2>&1; then
    code "$FILE_PATH"
elif [ -n "$EDITOR" ]; then
    $EDITOR "$FILE_PATH"
fi
