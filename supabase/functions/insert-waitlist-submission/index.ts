
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Parse request body
    const body = await req.json()
    console.log('Received waitlist submission:', body)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract and validate required fields
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      age,
      gender,
      city,
      state,
      fitnessApps = [],
      trainingApps = [],
      primaryGoals = [],
      workoutTypes = [],
      referralSource,
      otherFitnessApp,
      otherTrainingApp,
      otherGoal,
      otherWorkout,
      otherReferral,
      referralCode
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !city || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare data for insertion
    const insertData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber || null,
      age: age || null,
      gender: gender || null,
      city: city,
      state: state,
      location: `${city}, ${state}`,
      fitness_apps: fitnessApps,
      training_apps: trainingApps,
      primary_goal: Array.isArray(primaryGoals) ? primaryGoals.join(', ') : (primaryGoals || 'General fitness'),
      workout_types: workoutTypes,
      referral_source: referralSource || 'Other',
      other_fitness_app: otherFitnessApp || null,
      other_training_app: otherTrainingApp || null,
      other_goal: otherGoal || null,
      other_workout: otherWorkout || null,
      other_referral: otherReferral || null,
      referral_code: referralCode || null,
    }

    console.log('Inserting data:', insertData)

    // Insert into database
    const { data, error } = await supabase
      .from('waitlist_submissions')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save submission',
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully inserted:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Waitlist submission successful',
        data: data 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
