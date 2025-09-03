#!/bin/bash

# Pre-test setup script for Maestro E2E tests
# This script ensures test users are seeded before running tests

set -e

echo "🔧 Pre-test setup starting..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Load environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "   Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed"
    exit 1
fi

# Run the seed script
echo "🌱 Seeding test users..."
node scripts/seed-test-users.js

if [ $? -eq 0 ]; then
    echo "✅ Pre-test setup completed successfully"
else
    echo "❌ Error: Failed to seed test users"
    exit 1
fi

# Optional: Wait a moment for data to propagate
sleep 2

echo "🚀 Ready to run tests!"