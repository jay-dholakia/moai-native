import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Monday
    currentWeekStart.setHours(0, 0, 0, 0);

    console.log('Starting weekly buddy assignment for week:', currentWeekStart.toISOString());

    // Get all active moais
    const { data: moais, error: moaisError } = await supabase
      .from('moais')
      .select('id, name')
      .eq('is_active', true);

    if (moaisError) {
      console.error('Error fetching moais:', moaisError);
      throw moaisError;
    }

    let totalAssignments = 0;

    for (const moai of moais) {
      console.log(`Processing moai: ${moai.name} (${moai.id})`);
      
      // Archive previous week's buddy chats
      const { error: archiveError } = await supabase
        .rpc('archive_previous_buddy_chats', { p_moai_id: moai.id });

      if (archiveError) {
        console.error(`Error archiving previous buddy chats for moai ${moai.id}:`, archiveError);
        continue;
      }

      // Create new buddy pairings
      const { error: pairingError } = await supabase
        .rpc('create_weekly_buddy_pairings_enhanced', { p_moai_id: moai.id });

      if (pairingError) {
        console.error(`Error creating buddy pairings for moai ${moai.id}:`, pairingError);
        continue;
      }

      // Get the newly created pairings
      const { data: pairings, error: pairingsError } = await supabase
        .from('weekly_buddy_pairings')
        .select('buddy_group')
        .eq('moai_id', moai.id)
        .eq('week_start_date', currentWeekStart.toISOString().split('T')[0]);

      if (pairingsError) {
        console.error(`Error fetching pairings for moai ${moai.id}:`, pairingsError);
        continue;
      }

      // Create buddy chat channels for each pairing
      for (const pairing of pairings) {
        try {
          const { error: channelError } = await supabase
            .rpc('create_buddy_chat_channel', {
              p_moai_id: moai.id,
              p_week_start_date: currentWeekStart.toISOString().split('T')[0],
              p_buddy_group: pairing.buddy_group
            });

          if (channelError) {
            console.error(`Error creating buddy chat channel:`, channelError);
          } else {
            totalAssignments++;
            console.log(`Created buddy chat for group:`, pairing.buddy_group);
          }
        } catch (error) {
          console.error(`Error creating buddy chat channel:`, error);
        }
      }
    }

    console.log(`Weekly buddy assignment completed. Total assignments: ${totalAssignments}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weekly buddy assignment completed. Total assignments: ${totalAssignments}`,
        weekStart: currentWeekStart.toISOString(),
        totalAssignments
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in weekly buddy assignment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});