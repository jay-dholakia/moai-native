import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResendEmailRequest {
  coach_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is a platform admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is platform admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select(`
        role:roles(name)
      `)
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role?.name === 'PlatformAdmin');
    if (!isAdmin) {
      throw new Error("User not authorized to resend coach emails");
    }

    const { coach_id }: ResendEmailRequest = await req.json();
    console.log("Resending email for coach:", coach_id);

    // Get user email and profile information from auth.users
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(coach_id);
    
    if (authUserError || !authUser.user) {
      console.error("Auth user fetch error:", authUserError);
      throw new Error(`Failed to find coach user: ${authUserError?.message}`);
    }

    const coachEmail = authUser.user.email;
    if (!coachEmail) {
      throw new Error("Coach email not found");
    }

    // Get coach name from profiles (fallback to email if not available)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', coach_id)
      .single();

    const firstName = profile?.first_name || 'Coach';

    console.log("Sending welcome email to:", coachEmail);

    // Send welcome email to the coach
    try {
      const emailResponse = await resend.emails.send({
        from: "Moai Fitness <onboarding@resend.dev>", // Using Resend's verified domain
        to: [coachEmail],
        subject: "Welcome to Moai Fitness - Your Coach Portal is Ready!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">
              Welcome to Moai Fitness! 🏋️‍♂️
            </h1>
            
            <p>Hi ${firstName},</p>
            
            <p>This is a reminder that your coach account has been created and you need to complete your profile setup.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #6366f1; margin-top: 0;">What's Next?</h2>
              <p>🎯 <strong>Log into your Coach Portal</strong> to:</p>
              <ul style="margin: 10px 0;">
                <li>Complete your coach profile setup</li>
                <li>View and manage your assigned groups (Moais)</li>
                <li>Track member progress and engagement</li>
                <li>Send personalized messages and motivation</li>
                <li>Create workout programs and content</li>
                <li>Access coaching tools and analytics</li>
              </ul>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #d97706; margin-top: 0;">🔐 Getting Started:</h3>
              <p><strong>Email:</strong> ${coachEmail}</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:3000/coach-onboarding?new_coach=true" 
                   style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Set Up Your Coach Account
                </a>
              </div>
              
              <p><strong>What's Next:</strong></p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Click the button above to access your coach portal</li>
                <li>Set your secure password if prompted</li>
                <li>Complete your coach profile setup</li>
                <li>Start coaching and helping members achieve their goals!</li>
              </ol>
              <p><em>You'll receive a separate email with a secure authentication link if you need to reset your password.</em></p>
            </div>

            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>

            <p>We're excited to have you on board and look forward to seeing the impact you'll make!</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Moai Fitness Team</strong>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This email was sent to ${coachEmail} because you requested a reminder for your coach account setup.
            </p>
          </div>
        `,
      });

      console.log("Welcome email sent successfully:", { id: emailResponse.id, status: 'sent' });
      
      // Send password reset email for the coach
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: coachEmail,
        options: {
          redirectTo: `http://localhost:3000/coach-onboarding`
        }
      });

      if (resetError) {
        console.error("Failed to send password reset email:", resetError);
      } else {
        console.log("Password reset email sent successfully to:", coachEmail);
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      throw new Error(`Failed to send email: ${emailError}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Email resent successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in resend-coach-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);