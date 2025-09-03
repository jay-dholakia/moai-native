
#!/bin/bash

# Script to generate TypeScript types from Supabase schema

# Check if we should use local or production
if [ "$1" == "--local" ]; then
    echo "Generating types from local Supabase instance..."
    supabase gen types typescript --local > src/integrations/supabase/types.ts
else
    echo "Generating types from remote Supabase project..."
    supabase gen types typescript > src/integrations/supabase/types.ts
fi

# Format the file if Prettier is available
if command -v npx prettier >/dev/null 2>&1; then
    echo "Formatting generated types..."
    npx prettier --write src/integrations/supabase/types.ts
fi

echo "TypeScript types generated successfully at src/integrations/supabase/types.ts"
echo "Don't forget to commit these changes to keep your types in sync with the database."
