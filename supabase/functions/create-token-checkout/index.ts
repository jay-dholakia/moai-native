import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Token bundles mapping
const TOKEN_BUNDLES = {
  small: { price_cents: 500, tokens: 250, label: "Small Bundle" },
  medium: { price_cents: 1000, tokens: 500, label: "Medium Bundle" },
  large: { price_cents: 2000, tokens: 1000, label: "Large Bundle" },
  mega: { price_cents: 5000, tokens: 2500, label: "Mega Bundle" }
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const { bundleType } = await req.json();
    
    if (!bundleType || !(bundleType in TOKEN_BUNDLES)) {
      throw new Error("Invalid bundle type");
    }

    const bundle = TOKEN_BUNDLES[bundleType as keyof typeof TOKEN_BUNDLES];
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session for token purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${bundle.tokens} Moai Tokens`,
              description: bundle.label,
            },
            unit_amount: bundle.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/settings?purchase=success`,
      cancel_url: `${req.headers.get("origin")}/settings?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        bundle_type: bundleType,
        tokens_awarded: bundle.tokens.toString(),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating token checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});