import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { activityType, notes, exercises } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Create a prompt for summarizing the activity
    let activityContext = `Activity Type: ${activityType}`
    
    if (exercises && exercises.length > 0) {
      activityContext += `\nExercises: ${exercises.join(', ')}`
    }
    
    if (notes && notes.trim()) {
      activityContext += `\nNotes: ${notes.trim()}`
    }

    const prompt = `Summarize this fitness activity in 2-4 words maximum. Be concise and descriptive:

${activityContext}

Examples:
- "Chest & Triceps" for bench press workout
- "Leg Day" for squats/deadlifts
- "Morning Run" for cardio
- "Yoga Flow" for flexibility work

Summary:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a fitness activity summarizer. Provide ultra-concise 2-4 word summaries of workout activities.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content?.trim() || activityType

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})