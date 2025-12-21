import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
  const destination = url.searchParams.get('url')
  const label = url.searchParams.get('label')

  // If no destination URL, return error
  if (!destination) {
    return new Response('Missing destination URL', {
      status: 400,
      headers: corsHeaders
    })
  }

  const decodedUrl = decodeURIComponent(destination)

  // Track the click if we have a tracking ID
  if (trackingId) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get the sent_email record by tracking_id
        const { data: sentEmail } = await supabase
          .from('sent_emails')
          .select('id')
          .eq('tracking_id', trackingId)
          .single()

        if (sentEmail) {
          // Record the click
          await supabase.from('email_clicks').insert({
            sent_email_id: sentEmail.id,
            link_url: decodedUrl,
            link_label: label ? decodeURIComponent(label) : null,
            user_agent: req.headers.get('user-agent') || null,
            ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
          })
        }
      }
    } catch (error) {
      // Log error but still redirect
      console.error('Error tracking email click:', error)
    }
  }

  // Redirect to the destination URL
  return new Response(null, {
    status: 302,
    headers: {
      'Location': decodedUrl,
      ...corsHeaders
    }
  })
})
