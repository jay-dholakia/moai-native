#!/bin/bash

# Script to squash all Supabase migrations into a single file
set -e

echo "🔄 Starting migration squash process..."

# Create backup directory
BACKUP_DIR="supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup existing migrations
echo "📦 Backing up existing migrations to $BACKUP_DIR..."
cp -r supabase/migrations/* "$BACKUP_DIR/" 2>/dev/null || echo "No migrations to backup"

# Dump current schema
echo "📝 Dumping current database schema..."
supabase db dump --local -f supabase/schema/current_schema.sql

# Create new migration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
NEW_MIGRATION="supabase/migrations/${TIMESTAMP}_squashed_all_migrations.sql"

echo "✨ Creating new squashed migration: $NEW_MIGRATION"

# Add header to the new migration
cat > "$NEW_MIGRATION" << 'EOF'
-- Squashed migration containing all previous migrations
-- Generated on: $(date)

EOF

# Append the dumped schema
cat supabase/schema/current_schema.sql >> "$NEW_MIGRATION"

# Remove old migrations
echo "🗑️  Removing old migration files..."
find supabase/migrations -name "*.sql" ! -name "${TIMESTAMP}_squashed_all_migrations.sql" -delete

echo "✅ Migration squash complete!"
echo ""
echo "Next steps:"
echo "1. Review the new migration: $NEW_MIGRATION"
echo "2. Test with: supabase db reset"
echo "3. If issues occur, restore from: $BACKUP_DIR"
echo ""
echo "To restore backup if needed:"
echo "  rm -rf supabase/migrations/*"
echo "  cp -r $BACKUP_DIR/* supabase/migrations/"