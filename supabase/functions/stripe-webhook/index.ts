
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  console.log("🚀 Stripe webhook called!");
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  
  console.log("Body length:", body.length);
  console.log("Signature present:", !!signature);
  console.log("Webhook secret configured:", !!Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  
  let receivedEvent;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider
    );
    console.log("✅ Webhook signature verified! Event type:", receivedEvent.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (receivedEvent.type) {
      case "checkout.session.completed": {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        
        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        // Check if this is a token purchase, coach subscription, or regular subscription
        const bundleType = session.metadata?.bundle_type;
        const tokensAwarded = session.metadata?.tokens_awarded;
        const coachId = session.metadata?.coach_id;
        const planType = session.metadata?.plan_type;

        if (bundleType && tokensAwarded) {
          // Handle token purchase
          const tokensToAward = parseInt(tokensAwarded);
          
          // Record the token purchase
          const { error: purchaseError } = await supabaseClient
            .from("user_token_purchases")
            .insert({
              user_id: userId,
              tokens_awarded: tokensToAward,
              amount_usd: (session.amount_total || 0) / 100,
              stripe_session_id: session.id,
              bundle_type: bundleType,
            });

          if (purchaseError) {
            console.error("Error recording token purchase:", purchaseError);
            break;
          }

          // Update user's token balance
          const { data: currentProfile, error: fetchError } = await supabaseClient
            .from("profiles")
            .select("token_balance")
            .eq("id", userId)
            .single();

          if (!fetchError && currentProfile) {
            const newBalance = (currentProfile.token_balance || 0) + tokensToAward;
            
            const { error: updateError } = await supabaseClient
              .from("profiles")
              .update({ token_balance: newBalance })
              .eq("id", userId);

            if (updateError) {
              console.error("Error updating token balance:", updateError);
            } else {
              console.log(`Awarded ${tokensToAward} tokens to user ${userId}. New balance: ${newBalance}`);
            }
          }

          console.log(`Token purchase processed for user ${userId}: ${tokensToAward} tokens`);
        } else if (coachId && planType) {
          // Handle coach subscription
          console.log(`Processing coach subscription for user ${userId}, coach ${coachId}, plan ${planType}`);
          
          try {
            // Calculate subscription dates
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date();
            
            // Set end date based on plan type
            const durationMonths = planType === 'quarterly' ? 3 : 
                                  planType === 'semi_annual' ? 6 : 12;
            endDate.setMonth(endDate.getMonth() + durationMonths);
            const endDateStr = endDate.toISOString().split('T')[0];

            // First, deactivate any existing active subscriptions for this user
            const { error: deactivateError } = await supabaseClient
              .from('coach_subscriptions')
              .update({ status: 'cancelled' })
              .eq('user_id', userId)
              .eq('status', 'active');

            if (deactivateError) {
              console.error("Error deactivating existing subscriptions:", deactivateError);
            } else {
              console.log("Deactivated existing active subscriptions for user:", userId);
            }

            // Create new coach subscription record
            const { data: subscription, error: subscriptionError } = await supabaseClient
              .from("coach_subscriptions")
              .insert({
                user_id: userId,
                coach_id: coachId,
                plan_type: planType,
                plan_duration_months: durationMonths,
                amount_paid: (session.amount_total || 0) / 100,
                start_date: startDate,
                end_date: endDateStr,
                status: "active",
                stripe_payment_intent_id: session.payment_intent as string,
              })
              .select()
              .single();

            if (subscriptionError) {
              console.error("Error creating coach subscription:", subscriptionError);
              break;
            }

            console.log("Coach subscription created:", subscription);

            // Create private chat between coach and client
            const { data: chat, error: chatError } = await supabaseClient
              .from("coach_private_chats")
              .insert({
                coach_id: coachId,
                client_id: userId,
                is_active: true,
              })
              .select()
              .single();

            if (chatError) {
              console.error("Error creating coach private chat:", chatError);
              // Don't break here - subscription is still valid
            } else {
              console.log("Coach private chat created:", chat);
            }

            // Update user's current coach
            const { error: profileError } = await supabaseClient
              .from("profiles")
              .update({ current_coach_id: coachId })
              .eq("id", userId);

            if (profileError) {
              console.error("Error updating user's current coach:", profileError);
            }

            console.log(`Coach subscription processed successfully for user ${userId}`);
            
          } catch (error) {
            console.error("Error processing coach subscription:", error);
          }
        } else {
          // Handle regular subscription (existing logic)
          const { error } = await supabaseClient
            .from("user_subscriptions")
            .insert({
              user_id: userId,
              subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              payment_status: "active",
              amount_paid: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
              payment_date: new Date().toISOString(),
              is_active: true,
              // Note: moai_id will be set when user is matched to a guided moai
            });

          if (error) {
            console.error("Error creating subscription record:", error);
          } else {
            console.log("Subscription record created for user:", userId);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        
        // Update regular subscriptions
        const { error } = await supabaseClient
          .from("user_subscriptions")
          .update({
            payment_status: subscription.status,
            is_active: subscription.status === "active",
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }

        // Also update coach subscriptions if they exist
        const { error: coachError } = await supabaseClient
          .from("coach_subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", subscription.latest_invoice as string);

        if (coachError) {
          console.log("No coach subscription found or error updating:", coachError);
        }

        // If subscription is cancelled, deactivate the coach chat
        if (subscription.status !== "active") {
          const { error: chatError } = await supabaseClient
            .from("coach_private_chats")
            .update({
              is_active: false,
              archived_at: new Date().toISOString(),
            })
            .in("coach_id", [
              supabaseClient
                .from("coach_subscriptions")
                .select("coach_id")
                .eq("stripe_payment_intent_id", subscription.latest_invoice as string)
            ]);

          if (chatError) {
            console.log("Error deactivating coach chat:", chatError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});
