import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-COACH-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Missing sessionId");
    }

    logStep("Verifying Stripe session", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    if (!metadata?.user_id || !metadata?.coach_id || !metadata?.plan_type) {
      throw new Error("Invalid session metadata");
    }

    logStep("Payment verified, creating subscription", metadata);

    // Use service role key to create subscription
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(metadata.plan_duration_months));

    // Create subscription record
    const { data: subscription, error: subscriptionError } = await supabaseService
      .from('coach_subscriptions')
      .insert({
        user_id: metadata.user_id,
        coach_id: metadata.coach_id,
        plan_type: metadata.plan_type,
        plan_duration_months: parseInt(metadata.plan_duration_months),
        amount_paid: parseInt(metadata.amount_paid) / 100, // Convert from cents
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        stripe_payment_intent_id: session.payment_intent as string
      })
      .select()
      .single();

    if (subscriptionError) {
      logStep("Subscription creation failed", subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    logStep("Subscription created successfully", { subscriptionId: subscription.id });

    // Create private coaching chat
    const { data: chatData, error: chatError } = await supabaseService
      .from('coach_private_chats')
      .insert({
        coach_id: metadata.coach_id,
        client_id: metadata.user_id
      })
      .select()
      .single();

    if (chatError) {
      logStep("Chat creation failed", chatError);
      // Don't fail the whole process if chat creation fails
    } else {
      logStep("Chat created successfully", { chatId: chatData.id });
      
      // Get coach and user profile info for welcome message
      const { data: coachProfile } = await supabaseService
        .from('coaches')
        .select('profile_id, profiles:profile_id(first_name, last_name)')
        .eq('id', metadata.coach_id)
        .single();

      const { data: userProfile } = await supabaseService
        .from('profiles')
        .select('first_name')
        .eq('id', metadata.user_id)
        .single();

      // Send automated welcome message from coach
      if (coachProfile?.profile_id) {
        const coachName = `${coachProfile.profiles?.first_name} ${coachProfile.profiles?.last_name}`;
        const userName = userProfile?.first_name || "there";
        
        await supabaseService
          .from('coach_private_chat_messages')
          .insert({
            chat_id: chatData.id,
            sender_id: coachProfile.profile_id,
            message_content: `Hi ${userName}! 👋 Welcome to personal coaching! I'm ${coachName}, your dedicated fitness coach. I'm excited to help you achieve your fitness goals!\n\nTo get started, please complete your fitness questionnaire so I can create a personalized workout program just for you. Once you've filled it out, I'll review your responses and we can discuss your goals and preferences.\n\nLooking forward to working with you! 💪`,
            message_type: 'welcome',
            is_automated: true
          });
        
        logStep("Welcome message sent", { coachName, userName });
      }
    }

    // Update profile with current coach
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({ current_coach_id: metadata.coach_id })
      .eq('id', metadata.user_id);

    if (profileError) {
      logStep("Profile update failed", profileError);
    }

    // Calculate moai coach match percentages for all user's moais
    const { data: userMoais } = await supabaseService
      .from('moai_members')
      .select('moai_id')
      .eq('profile_id', metadata.user_id)
      .eq('is_active', true);

    if (userMoais) {
      for (const moaiMember of userMoais) {
        // Call the function to update coach match percentage
        await supabaseService.rpc('check_and_create_group_coaching_chat', {
          p_moai_id: moaiMember.moai_id
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      subscription: subscription 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});