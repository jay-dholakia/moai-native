import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_intent_id } = await req.json();
    
    if (!payment_intent_id) {
      throw new Error('Payment intent ID is required');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Retrieve the payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    const { coach_id: coachId, plan_type: planType, duration_months } = paymentIntent.metadata;
    
    if (!coachId || !planType) {
      throw new Error('Missing payment metadata');
    }

    // Calculate subscription dates
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(duration_months || '3'));
    const endDateStr = endDate.toISOString().split('T')[0];

    // Deactivate any existing active subscriptions for this user
    const { error: deactivateError } = await supabaseClient
      .from('coach_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (deactivateError) {
      console.error("Error deactivating existing subscriptions:", deactivateError);
    }

    // Create new coach subscription record
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from("coach_subscriptions")
      .insert({
        user_id: user.id,
        coach_id: coachId,
        plan_type: planType,
        plan_duration_months: parseInt(duration_months || '3'),
        amount_paid: paymentIntent.amount / 100,
        start_date: startDate,
        end_date: endDateStr,
        status: "active",
        stripe_payment_intent_id: payment_intent_id,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error("Error creating coach subscription:", subscriptionError);
      throw new Error('Failed to create subscription');
    }

    // Create private chat between coach and client
    const { data: chat, error: chatError } = await supabaseClient
      .from("coach_private_chats")
      .insert({
        coach_id: coachId,
        client_id: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (chatError) {
      console.error("Error creating coach private chat:", chatError);
    }

    // Update user's current coach
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({ current_coach_id: coachId })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating user's current coach:", profileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        chat_id: chat?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error completing subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
    }
    );
  }
});