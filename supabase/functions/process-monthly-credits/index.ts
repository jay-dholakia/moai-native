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
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting monthly credit processing...');

    // Get all active coach subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('coach_subscriptions')
      .select('*')
      .eq('status', 'active');

    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError);
      throw subscriptionError;
    }

    console.log(`📊 Processing ${subscriptions.length} active subscriptions`);

    let processedCount = 0;
    let totalCreditsDistributed = 0;
    const currentBillingCycle = new Date().toISOString().split('T')[0];

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Calculate monthly credit for this user
        const { data: creditAmount, error: creditError } = await supabase
          .rpc('calculate_monthly_credit', {
            p_user_id: subscription.user_id
          });

        if (creditError) {
          console.error(`Error calculating credit for user ${subscription.user_id}:`, creditError);
          continue;
        }

        const monthlyCredit = creditAmount || 0;

        // Update user's monthly credit and add to balance
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            monthly_coach_credit: monthlyCredit,
            moai_credit_balance: supabase.sql`coalesce(moai_credit_balance, 0) + ${monthlyCredit}`,
            last_credit_calculation: new Date().toISOString()
          })
          .eq('id', subscription.user_id);

        if (updateError) {
          console.error(`Error updating credits for user ${subscription.user_id}:`, updateError);
          continue;
        }

        // Record credit history if credits were earned
        if (monthlyCredit > 0) {
          // Get coached members count for history record
          const { data: coachedCount, error: countError } = await supabase
            .rpc('get_coached_members_count', {
              p_user_id: subscription.user_id,
              p_coach_id: subscription.coach_id
            });

          const membersCount = coachedCount || 0;

          const { error: historyError } = await supabase
            .from('credit_history')
            .insert({
              user_id: subscription.user_id,
              credit_type: 'earned',
              amount: monthlyCredit,
              description: `Monthly credit earned - ${membersCount} coached members in Moai`,
              coach_id: subscription.coach_id,
              billing_cycle_start: currentBillingCycle
            });

          if (historyError) {
            console.error(`Error recording credit history for user ${subscription.user_id}:`, historyError);
            continue;
          }

          totalCreditsDistributed += monthlyCredit;
        }

        processedCount++;
        console.log(`✅ Processed user ${subscription.user_id}: $${monthlyCredit} credits`);

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        continue;
      }
    }

    console.log(`🎉 Monthly credit processing completed!`);
    console.log(`📈 Processed: ${processedCount} users`);
    console.log(`💰 Total credits distributed: $${totalCreditsDistributed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly credit processing completed',
        processedCount,
        totalCreditsDistributed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in monthly credit processing:', error);
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