
#!/bin/bash

# Setup script for Supabase declarative schema workflow

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    supabase init
fi

# Link to remote project
echo "You'll need to link this project to your Supabase project."
echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
echo "Your project ref can be found in the Supabase dashboard URL."

# Set up local development
echo "To start Supabase locally, run:"
echo "supabase start"

# Instructions for applying migrations
echo "To apply migrations locally:"
echo "supabase db reset"

# Instructions for generating types
echo "To generate TypeScript types:"
echo "supabase gen types typescript --local > src/integrations/supabase/types.ts"

echo "Setup complete! Follow the README for more information."
