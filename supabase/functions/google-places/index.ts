
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, placeId, action } = await req.json()
    // Use the provided API key directly
    const apiKey = 'AIzaSyA6aqW3EWEZDFG4bjjoKdE5npq76adJUPU'
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    let response
    
    if (action === 'autocomplete') {
      // Places Autocomplete - removed types=address restriction to allow POIs
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`
      response = await fetch(url)
    } else if (action === 'details') {
      // Place Details
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,formatted_address,geometry&key=${apiKey}`
      response = await fetch(url)
    } else {
      throw new Error('Invalid action')
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
