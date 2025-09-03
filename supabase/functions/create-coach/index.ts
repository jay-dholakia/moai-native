import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateCoachRequest {
  first_name: string;
  last_name: string;
  email: string;
  coach_accountability_style?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  languages_spoken?: string[];
  monthly_price?: number;
  coach_status?: string;
  internal_notes?: string;
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
      throw new Error("User not authorized to create coaches");
    }

    const coachData: CreateCoachRequest = await req.json();
    console.log("Creating coach with data:", { email: coachData.email, first_name: coachData.first_name, last_name: coachData.last_name });

    // Create the auth user
    const { data: authUser, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email: coachData.email,
      email_confirm: true,
      user_metadata: {
        first_name: coachData.first_name,
        last_name: coachData.last_name,
        coach_accountability_style: coachData.coach_accountability_style,
      }
    });

    if (authError2 || !authUser.user) {
      console.error("Auth user creation failed:", authError2);
      throw new Error(`Failed to create auth user: ${authError2?.message}`);
    }

    console.log("Auth user created successfully:", authUser.user.id);

    // Ensure profile exists for this user
    console.log("Creating profile for user:", authUser.user.id);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        first_name: coachData.first_name,
        last_name: coachData.last_name,
        coach_accountability_style: coachData.coach_accountability_style,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the entire operation for profile creation issues
    } else {
      console.log("Profile created successfully");
    }

    // Create the coach record
    console.log("Creating coach record for profile:", authUser.user.id);
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('coaches')
      .insert({
        profile_id: authUser.user.id,
        bio: coachData.bio,
        specialties: coachData.specialties || [],
        certifications: coachData.certifications || [],
        languages_spoken: coachData.languages_spoken || [],
        monthly_price: coachData.monthly_price || 79,
        coach_status: coachData.coach_status || 'active',
        internal_notes: coachData.internal_notes,
      })
      .select()
      .single();

    if (coachError) {
      console.error("Coach creation failed:", coachError);
      // Clean up the auth user if coach creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create coach: ${coachError.message}`);
    }

    console.log("Coach created successfully:", coach.id);

    // Assign the "Coach" role to the newly created user
    console.log("Assigning Coach role to user:", authUser.user.id);
    const { data: coachRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'Coach')
      .single();

    if (coachRole) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role_id: coachRole.id
        });

      if (roleError) {
        console.error("Failed to assign Coach role:", roleError);
        // Don't fail the entire operation, but log the error
      } else {
        console.log("Coach role assigned successfully");
      }
    } else {
      console.error("Coach role not found in roles table");
    }

    // Send welcome email to the new coach
    console.log("Attempting to send welcome email to:", coachData.email);
    try {
      const emailResponse = await resend.emails.send({
        from: "Moai Fitness <onboarding@resend.dev>", // Using Resend's verified domain
        to: [coachData.email],
        subject: "Welcome to Moai Fitness - Your Coach Portal is Ready!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">
              Welcome to Moai Fitness! 🏋️‍♂️
            </h1>
            
            <p>Hi ${coachData.first_name},</p>
            
            <p>Congratulations! Your coach account has been successfully created. You're now part of the Moai Fitness coaching team!</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #6366f1; margin-top: 0;">What's Next?</h2>
              <p>🎯 <strong>Log into your Coach Portal</strong> to:</p>
              <ul style="margin: 10px 0;">
                <li>View and manage your assigned groups (Moais)</li>
                <li>Track member progress and engagement</li>
                <li>Send personalized messages and motivation</li>
                <li>Create workout programs and content</li>
                <li>Access coaching tools and analytics</li>
              </ul>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #d97706; margin-top: 0;">🔐 Getting Started:</h3>
              <p><strong>Email:</strong> ${coachData.email}</p>
              <p><strong>What's Next:</strong></p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Check your email for a password setup link</li>
                <li>Set your secure password</li>
                <li>Complete your coach profile setup</li>
                <li>Start coaching and helping members achieve their goals!</li>
              </ol>
              <p><em>You'll receive a separate email with a secure authentication link.</em></p>
            </div>

            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>

            <p>We're excited to have you on board and look forward to seeing the impact you'll make!</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Moai Fitness Team</strong>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This email was sent to ${coachData.email} because a coach account was created for you.
            </p>
          </div>
        `,
      });

      console.log("Welcome email sent successfully:", { id: emailResponse.id, status: 'sent' });
      
      // Send password reset email for the new coach
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: coachData.email,
        options: {
          redirectTo: `${Deno.env.get('FRONTEND_URL') || 'https://dwbhpjtnhmtdtmfxpacj.lovableproject.com'}/coach-onboarding`
        }
      });

      if (resetError) {
        console.error("Failed to send password reset email:", resetError);
      } else {
        console.log("Password reset email sent successfully to:", coachData.email);
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the entire operation if email fails, but log the specific error
      console.error("Email error details:", JSON.stringify(emailError, null, 2));
    }

    return new Response(JSON.stringify({ success: true, coach }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in create-coach function:", error);
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