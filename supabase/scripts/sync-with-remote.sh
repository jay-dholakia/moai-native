#!/bin/bash

# Script to sync local Supabase schema with remote

echo "Syncing local Supabase schema with remote..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if ! supabase status &> /dev/null; then
    echo "Not linked to a Supabase project. Run 'supabase link' first."
    exit 1
fi

# Backup current schema.sql
if [ -f "supabase/schemas/schema.sql" ]; then
    echo "Backing up current schema.sql..."
    cp supabase/schemas/schema.sql supabase/schemas/schema.sql.backup
fi

# Pull remote schema
echo "Pulling remote schema..."
supabase db dump -f supabase/schemas/schema.sql

# Reset local database to match remote
echo "Resetting local database..."
supabase db reset

# Generate fresh TypeScript types
echo "Generating TypeScript types..."
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Format types if prettier is available
if command -v npx prettier >/dev/null 2>&1; then
    echo "Formatting generated types..."
    npx prettier --write src/integrations/supabase/types.ts
fi

echo "✅ Local schema is now in sync with remote!"
echo "📝 Backup of previous schema saved as: supabase/schemas/schema.sql.backup"
echo "🔄 Don't forget to commit the updated schema.sql and types.ts files"
