import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Create Supabase client using the anon key for user authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { coachId } = await req.json();

    if (!coachId) {
      return new Response(
        JSON.stringify({ error: 'Coach ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get coached members count for this coach in user's moais
    const { data: coachedCount, error: countError } = await supabase
      .rpc('get_coached_members_count', {
        p_user_id: user.id,
        p_coach_id: coachId
      });

    if (countError) {
      console.error('Error getting coached members count:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate credit preview' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const membersCount = coachedCount || 0;

    // Calculate credit based on tier
    let creditAmount = 0;
    if (membersCount <= 1) {
      creditAmount = 0;
    } else if (membersCount >= 2 && membersCount <= 3) {
      creditAmount = 10;
    } else if (membersCount >= 4 && membersCount <= 5) {
      creditAmount = 20;
    } else if (membersCount >= 6 && membersCount <= 8) {
      creditAmount = 30;
    } else {
      creditAmount = 30; // Cap at $30
    }

    // Get tier name
    let tierName = 'No Credits';
    if (membersCount >= 2 && membersCount <= 3) {
      tierName = 'Bronze';
    } else if (membersCount >= 4 && membersCount <= 5) {
      tierName = 'Silver';
    } else if (membersCount >= 6 && membersCount <= 8) {
      tierName = 'Gold';
    } else if (membersCount > 8) {
      tierName = 'Platinum';
    }

    return new Response(
      JSON.stringify({
        success: true,
        creditAmount,
        membersCount,
        tierName,
        message: creditAmount > 0 
          ? `You could earn $${creditAmount}/month with ${membersCount} coached members in your Moai`
          : 'Invite others in your Moai to coach with the same coach to start earning credits'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in credit preview calculation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});