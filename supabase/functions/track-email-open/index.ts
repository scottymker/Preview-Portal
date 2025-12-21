import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 1x1 transparent GIF (smallest valid GIF)
const TRACKING_PIXEL = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  c => c.charCodeAt(0)
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const trackingId = url.searchParams.get('tid')

  // Always return the tracking pixel, even if no tracking ID
  const pixelResponse = () => new Response(TRACKING_PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...corsHeaders
    }
  })

  if (!trackingId) {
    return pixelResponse()
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return pixelResponse()
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, try to set opened_at if not already set (first open)
    const { data: existingEmail } = await supabase
      .from('sent_emails')
      .select('id, opened_at')
      .eq('tracking_id', trackingId)
      .single()

    if (existingEmail) {
      if (!existingEmail.opened_at) {
        // First open - set opened_at and increment count
        await supabase
          .from('sent_emails')
          .update({
            opened_at: new Date().toISOString(),
            open_count: 1
          })
          .eq('tracking_id', trackingId)
      } else {
        // Subsequent opens - just increment count
        await supabase.rpc('increment_open_count', { row_tracking_id: trackingId })
      }
    }
  } catch (error) {
    // Log error but still return pixel
    console.error('Error tracking email open:', error)
  }

  return pixelResponse()
})
