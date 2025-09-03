
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, lat, lng, action } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    let response
    
    if (action === 'geocode') {
      // Forward Geocoding
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      response = await fetch(url)
    } else if (action === 'reverse') {
      // Reverse Geocoding
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
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
