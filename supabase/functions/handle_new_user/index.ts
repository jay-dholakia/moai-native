
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the user data from the request
    const { user } = await req.json();

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: 'User data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // Only create profile if it doesn't exist
    if (!existingProfile) {
      // Create a basic profile for the user
      const { data, error } = await supabaseClient
        .from('profiles')
        .insert({ id: user.id })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, profile: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Profile already exists' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error creating profile:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
