
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { origin, destination, travelMode = 'WALKING', waypoints } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    
    console.log('Google Directions API called with:', { origin, destination, travelMode, waypoints })
    
    if (!apiKey) {
      console.error('Google Maps API key not configured')
      throw new Error('Google Maps API key not configured')
    }

    if (!origin || !destination) {
      console.error('Missing origin or destination:', { origin, destination })
      throw new Error('Origin and destination are required')
    }

    // Build the directions API URL
    const originParam = `${origin.lat},${origin.lng}`
    const destinationParam = `${destination.lat},${destination.lng}`
    
    let url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${originParam}&` +
      `destination=${destinationParam}&` +
      `mode=${travelMode.toLowerCase()}&` +
      `key=${apiKey}`

    // Add waypoints if provided
    if (waypoints && waypoints.length > 0) {
      const waypointsParam = waypoints
        .map((wp: any) => `${wp.lat},${wp.lng}`)
        .join('|')
      url += `&waypoints=${waypointsParam}`
    }

    console.log('Making request to Google Directions API:', url.replace(apiKey, '[API_KEY]'))

    const response = await fetch(url)
    const data = await response.json()
    
    console.log('Google Directions API response status:', data.status)
    console.log('Routes found:', data.routes?.length || 0)
    
    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data.status, data.error_message)
    }
    
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in google-directions function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
