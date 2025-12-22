import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscoveryRequest {
  query?: string           // Search query like "plumber austin tx"
  location?: string        // Location to search
  limit?: number          // Number of results (default 10)
  manualUrls?: string[]   // Manual URLs to add
}

interface GoogleSearchResult {
  link: string
  title: string
  snippet: string
  displayLink: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, location, limit = 10, manualUrls } = await req.json() as DiscoveryRequest

    const leads: any[] = []

    // Handle manual URL additions
    if (manualUrls && manualUrls.length > 0) {
      for (const url of manualUrls) {
        // Normalize URL
        let normalizedUrl = url.trim()
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = 'https://' + normalizedUrl
        }

        // Check if URL already exists
        const { data: existing } = await supabaseClient
          .from('automation_leads')
          .select('id')
          .eq('business_url', normalizedUrl)
          .maybeSingle()

        if (!existing) {
          // Create lead
          const { data: lead, error } = await supabaseClient
            .from('automation_leads')
            .insert({
              business_url: normalizedUrl,
              source: 'manual',
              workflow_status: 'discovered',
              analysis_status: 'pending',
              generation_status: 'pending',
              discovered_at: new Date().toISOString()
            })
            .select()
            .single()

          if (!error && lead) {
            leads.push(lead)
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, leads, count: leads.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle Google Custom Search
    if (query) {
      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY')
      const GOOGLE_CX = Deno.env.get('GOOGLE_SEARCH_CX')

      if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        return new Response(
          JSON.stringify({ error: 'Google Search API not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Build search query
      let searchQuery = query
      if (location) {
        searchQuery = `${query} ${location}`
      }
      // Add terms to find small businesses with websites
      searchQuery = `${searchQuery} small business website`

      // Call Google Custom Search API
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1')
      searchUrl.searchParams.set('key', GOOGLE_API_KEY)
      searchUrl.searchParams.set('cx', GOOGLE_CX)
      searchUrl.searchParams.set('q', searchQuery)
      searchUrl.searchParams.set('num', Math.min(limit, 10).toString()) // Max 10 per request

      console.log('Searching Google:', searchQuery)

      const searchResponse = await fetch(searchUrl.toString())
      const searchData = await searchResponse.json()

      if (searchData.error) {
        console.error('Google API error:', searchData.error)
        return new Response(
          JSON.stringify({ error: searchData.error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const items: GoogleSearchResult[] = searchData.items || []

      // Process search results
      for (const item of items) {
        try {
          // Skip common non-business sites
          const skipDomains = ['facebook.com', 'yelp.com', 'yellowpages.com', 'linkedin.com',
                              'google.com', 'maps.google.com', 'instagram.com', 'twitter.com',
                              'pinterest.com', 'youtube.com', 'amazon.com', 'ebay.com',
                              'wikipedia.org', 'bbb.org', 'angieslist.com', 'thumbtack.com',
                              'homeadvisor.com', 'houzz.com', 'nextdoor.com']

          const url = new URL(item.link)
          const domain = url.hostname.replace('www.', '')

          if (skipDomains.some(skip => domain.includes(skip))) {
            continue
          }

          // Check if URL already exists
          const { data: existing } = await supabaseClient
            .from('automation_leads')
            .select('id')
            .eq('business_url', item.link)
            .maybeSingle()

          if (existing) {
            continue
          }

          // Try to extract business name from title
          let businessName = item.title
            .replace(/ - .*$/, '')  // Remove anything after dash
            .replace(/\|.*$/, '')    // Remove anything after pipe
            .replace(/\s+Home$/, '') // Remove trailing "Home"
            .trim()

          // Create lead
          const { data: lead, error } = await supabaseClient
            .from('automation_leads')
            .insert({
              business_url: item.link,
              business_name: businessName,
              business_description: item.snippet,
              source: 'google_search',
              source_query: searchQuery,
              source_location: location || null,
              workflow_status: 'discovered',
              analysis_status: 'pending',
              generation_status: 'pending',
              discovered_at: new Date().toISOString()
            })
            .select()
            .single()

          if (!error && lead) {
            leads.push(lead)
          }
        } catch (e) {
          console.error('Error processing search result:', e)
        }
      }

      // If limit > 10, make additional requests (Google API returns max 10 per request)
      if (limit > 10 && items.length >= 10) {
        const additionalSearchUrl = new URL('https://www.googleapis.com/customsearch/v1')
        additionalSearchUrl.searchParams.set('key', GOOGLE_API_KEY)
        additionalSearchUrl.searchParams.set('cx', GOOGLE_CX)
        additionalSearchUrl.searchParams.set('q', searchQuery)
        additionalSearchUrl.searchParams.set('start', '11')
        additionalSearchUrl.searchParams.set('num', Math.min(limit - 10, 10).toString())

        const additionalResponse = await fetch(additionalSearchUrl.toString())
        const additionalData = await additionalResponse.json()

        const additionalItems: GoogleSearchResult[] = additionalData.items || []

        for (const item of additionalItems) {
          try {
            const skipDomains = ['facebook.com', 'yelp.com', 'yellowpages.com', 'linkedin.com',
                                'google.com', 'maps.google.com', 'instagram.com', 'twitter.com',
                                'pinterest.com', 'youtube.com', 'amazon.com', 'ebay.com',
                                'wikipedia.org', 'bbb.org', 'angieslist.com', 'thumbtack.com',
                                'homeadvisor.com', 'houzz.com', 'nextdoor.com']

            const url = new URL(item.link)
            const domain = url.hostname.replace('www.', '')

            if (skipDomains.some(skip => domain.includes(skip))) {
              continue
            }

            const { data: existing } = await supabaseClient
              .from('automation_leads')
              .select('id')
              .eq('business_url', item.link)
              .maybeSingle()

            if (existing) continue

            let businessName = item.title
              .replace(/ - .*$/, '')
              .replace(/\|.*$/, '')
              .replace(/\s+Home$/, '')
              .trim()

            const { data: lead, error } = await supabaseClient
              .from('automation_leads')
              .insert({
                business_url: item.link,
                business_name: businessName,
                business_description: item.snippet,
                source: 'google_search',
                source_query: searchQuery,
                source_location: location || null,
                workflow_status: 'discovered',
                analysis_status: 'pending',
                generation_status: 'pending',
                discovered_at: new Date().toISOString()
              })
              .select()
              .single()

            if (!error && lead) {
              leads.push(lead)
            }
          } catch (e) {
            console.error('Error processing additional search result:', e)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads,
        count: leads.length,
        message: `Discovered ${leads.length} new leads`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Discovery error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
