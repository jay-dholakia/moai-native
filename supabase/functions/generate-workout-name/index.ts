
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exercises } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Extract exercise names for the prompt
    const exerciseNames = exercises.map((ex: any) => ex.name).join(', ');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a fitness expert that creates catchy, motivational workout names. Generate a short, creative name (2-4 words max) for a workout based on the exercises provided. Make it energetic and memorable. Examples: "Upper Body Blast", "Leg Day Crusher", "Core Destroyer", "Power Push Session".'
          },
          { 
            role: 'user', 
            content: `Create a workout name for these exercises: ${exerciseNames}`
          }
        ],
        max_tokens: 20,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const workoutName = data.choices[0].message.content.replace(/['"]/g, '').trim();

    return new Response(JSON.stringify({ workoutName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating workout name:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
