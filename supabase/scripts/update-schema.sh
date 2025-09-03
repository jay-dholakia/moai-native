
#!/bin/bash

# Script to update the schema.sql file from the current database state

# Check if we should use local or production
if [ "$1" == "--local" ]; then
    echo "Updating schema.sql from local Supabase instance..."
    SCHEMA_SOURCE="local"
else
    echo "Updating schema.sql from remote Supabase project..."
    SCHEMA_SOURCE="remote"
fi

# Create directory if it doesn't exist
mkdir -p supabase/schemas

# Create or update schema.sql with current database state
if [ "$SCHEMA_SOURCE" == "local" ]; then
    supabase db dump --local -f supabase/schemas/schema.sql
else
    supabase db dump -f supabase/schemas/schema.sql
fi

# Format the schema file to make it more readable
if command -v pg_format >/dev/null 2>&1; then
    pg_format -f 1 -o supabase/schemas/schema.sql supabase/schemas/schema.sql
fi

echo "Schema.sql has been updated successfully!"
echo "This file now represents the current state of your database."
