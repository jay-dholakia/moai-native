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
    const { coachId, planType = 'quarterly' } = await req.json();
    
    if (!coachId) {
      throw new Error('Coach ID is required');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseClient
      .from('coach_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Get coach details
    const { data: coach, error: coachError } = await supabaseClient
      .from('coaches')
      .select('id, profile_id')
      .eq('id', coachId)
      .eq('is_active', true)
      .maybeSingle();

    if (coachError || !coach) {
      throw new Error('Coach not found');
    }

    // Get profile details
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', coach.profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Coach profile not found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId = customers.data[0]?.id;

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Define pricing based on plan type
    const pricing = {
      quarterly: {
        amount: 4500, // $45.00 in cents (3 months * $15)
        duration_months: 3,
      },
      semi_annual: {
        amount: 8400, // $84.00 in cents (6 months * $14)
        duration_months: 6,
      },
      annual: {
        amount: 15600, // $156.00 in cents (12 months * $13)
        duration_months: 12,
      },
    };

    const plan = pricing[planType as keyof typeof pricing] || pricing.quarterly;

    // Create payment intent for one-time payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.amount,
      currency: 'usd',
      customer: customerId,
      description: `1-on-1 Coaching with ${profile.first_name} ${profile.last_name} (${planType})`,
      metadata: {
        coach_id: coachId,
        user_id: user.id,
        plan_type: planType,
        duration_months: plan.duration_months.toString(),
      },
    });

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        amount: plan.amount,
        coach_name: `${profile.first_name} ${profile.last_name}`,
        plan_type: planType,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});