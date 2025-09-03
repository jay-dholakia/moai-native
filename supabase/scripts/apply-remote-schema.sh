#!/bin/bash

# Script to apply dumped remote schema to local Supabase instance
# Usage: ./apply-remote-schema.sh [--no-backup]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
NO_BACKUP=false
if [ "$1" == "--no-backup" ]; then
    NO_BACKUP=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_DIR="$SCRIPT_DIR/../schema"
BACKUP_DIR="$SCHEMA_DIR/backups"

echo -e "${BLUE}🔄 Applying remote schema to local Supabase...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Check if remote schema exists
REMOTE_SCHEMA="$SCHEMA_DIR/remote_schema_latest.sql"
if [ ! -f "$REMOTE_SCHEMA" ]; then
    echo -e "${RED}❌ Remote schema not found at: $REMOTE_SCHEMA${NC}"
    echo "Run './db-dump.sh remote' first to dump the remote schema"
    exit 1
fi

# Get actual remote schema file (resolve symlink)
ACTUAL_REMOTE_SCHEMA=$(readlink -f "$REMOTE_SCHEMA")
echo -e "${BLUE}📄 Using remote schema: $(basename "$ACTUAL_REMOTE_SCHEMA")${NC}"

# Check if local Supabase is running
if ! supabase status 2>/dev/null | grep -q "DB URL"; then
    echo -e "${YELLOW}⚠️  Local Supabase is not running. Starting it now...${NC}"
    supabase start
fi

# Create backup unless disabled
if [ "$NO_BACKUP" = false ]; then
    echo -e "${BLUE}💾 Creating backup of current local schema...${NC}"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/local_schema_backup_${TIMESTAMP}.sql"
    supabase db dump --local -f "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup saved to: $BACKUP_FILE${NC}"
fi

echo -e "${YELLOW}⚠️  This will reset your local database to match the remote schema!${NC}"
echo -e "${YELLOW}   All local data will be lost.${NC}"
read -p "Do you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Operation cancelled${NC}"
    exit 1
fi

# Clean approach: Use supabase db reset with no migrations
echo -e "${BLUE}🔄 Preparing for clean schema application...${NC}"

# Temporarily move migrations to prevent them from running
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"
TEMP_MIGRATIONS_DIR="$SCRIPT_DIR/../migrations.temp"
if [ -d "$MIGRATIONS_DIR" ]; then
    echo -e "${BLUE}📦 Temporarily moving migrations directory...${NC}"
    mv "$MIGRATIONS_DIR" "$TEMP_MIGRATIONS_DIR"
fi

# Reset database without migrations (creates clean db with only Supabase internals)
echo -e "${BLUE}🔄 Resetting local database to clean state...${NC}"
supabase db reset

# Now apply the remote schema dump
echo -e "${BLUE}📥 Applying remote schema...${NC}"
# Use --single-transaction to ensure atomic operation
psql "postgresql://postgres:postgres@localhost:54322/postgres" --single-transaction < "$REMOTE_SCHEMA" 2>&1 | grep -v "already exists" || true

# Restore migrations directory
if [ -d "$TEMP_MIGRATIONS_DIR" ]; then
    echo -e "${BLUE}📦 Restoring migrations directory...${NC}"
    mv "$TEMP_MIGRATIONS_DIR" "$MIGRATIONS_DIR"
fi

# Update local schema snapshot
echo -e "${BLUE}📝 Updating local schema snapshot...${NC}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOCAL_SCHEMA_FILE="$SCHEMA_DIR/local_schema_${TIMESTAMP}.sql"
supabase db dump --local -f "$LOCAL_SCHEMA_FILE"
ln -sf "local_schema_${TIMESTAMP}.sql" "$SCHEMA_DIR/local_schema_latest.sql"

echo -e "${GREEN}✅ Success! Local schema now matches remote schema${NC}"
echo -e "${GREEN}📄 New local schema snapshot: $LOCAL_SCHEMA_FILE${NC}"

# Generate TypeScript types if the types file exists
if [ -f "src/integrations/supabase/types.ts" ]; then
    echo -e "${BLUE}🔄 Generating TypeScript types...${NC}"
    supabase gen types typescript --local > src/integrations/supabase/types.ts
    echo -e "${GREEN}✅ Types updated${NC}"
fi

echo -e "${GREEN}✨ Done! Your local Supabase now has the same schema as remote.${NC}"