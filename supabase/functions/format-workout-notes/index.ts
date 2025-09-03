import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notes, activityType } = await req.json();

    if (!notes || !openAIApiKey) {
      return new Response(JSON.stringify({ formattedNotes: notes || '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
            content: `You are a fitness assistant that formats workout notes clearly. Take the provided workout notes and format them as a clean list where each exercise is on its own line. 

Rules:
- Each exercise should be on a separate line
- Keep exercise names, sets, reps, and weights together
- Remove unnecessary formatting or extra spaces
- If there are multiple exercises, list them clearly
- Preserve important details like weights, reps, sets
- If it's not a workout (like "Rest day" or general notes), return as-is
- Return only the formatted text, no extra commentary`
          },
          {
            role: 'user',
            content: `Activity Type: ${activityType}\nNotes: ${notes}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const formattedNotes = data.choices?.[0]?.message?.content || notes;

    return new Response(JSON.stringify({ formattedNotes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in format-workout-notes function:', error);
    return new Response(JSON.stringify({ formattedNotes: notes || '' }), {
      status: 200, // Return 200 with fallback to prevent UI errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});