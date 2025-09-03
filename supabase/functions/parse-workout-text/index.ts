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

  if (!openAIApiKey) {
    console.error('OpenAI API key not configured');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input: text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing workout text:', text);

    const systemPrompt = `You are a fitness expert AI that parses workout text into structured JSON format. 

RULES:
1. Extract exercises with their sets, reps, and weights
2. Identify supersets (exercises grouped together) and circuits
3. Normalize exercise names to common variations
4. Convert weight units to standard format (lbs or kg)
5. If title is present, extract it; otherwise leave empty
6. Handle various formats: "4x10", "4 sets 10 reps", "4x10@150lbs", etc.
7. For ambiguous cases, make reasonable fitness assumptions

OUTPUT FORMAT (strict JSON):
{
  "title": "string or empty",
  "exercises": [
    {
      "name": "standardized exercise name",
      "sets": number,
      "reps": number, 
      "weight": number or null,
      "unit": "lbs" or "kg" or null
    }
  ],
  "groups": [
    {
      "type": "superset" or "circuit",
      "label": "optional label",
      "rounds": number,
      "exercises": [/* same format as above */]
    }
  ],
  "unparsed_exercises": ["lines that couldn't be parsed"]
}

EXERCISE NAME STANDARDIZATION:
- "Bench Press", "BP" → "Barbell Bench Press"
- "Squat" → "Barbell Squat" 
- "DB Press" → "Dumbbell Press"
- etc.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this workout text:\n\n${text}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'OpenAI API error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const parsedContent = JSON.parse(data.choices[0].message.content);
    
    console.log('Parsed workout:', parsedContent);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-workout-text function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});