
#!/bin/bash

# Script to set up the migration workflow

# Make sure all scripts are executable
chmod +x supabase/scripts/*.sh

echo "Migration workflow scripts are now executable."
echo ""
echo "Available commands:"
echo "  supabase/scripts/create-migration.sh <name> [description]  - Create a new empty migration"
echo "  supabase/scripts/update-schema.sh [--local]              - Update schema.sql from database"
echo "  supabase/scripts/generate-migration-from-diff.sh <name>  - Generate migration from diff"
echo ""
echo "Workflow:"
echo "1. Make schema changes locally with 'supabase start'"
echo "2. Create migrations for your changes"
echo "3. Update schema.sql to reflect the current state"
echo "4. Commit both the migration and updated schema.sql"
echo ""
echo "This ensures your schema is declarative and changes are tracked with migrations."
