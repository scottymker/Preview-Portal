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
  findWithoutWebsites?: boolean  // Find businesses without websites via Google Places
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

    const { query, location, limit = 10, manualUrls, findWithoutWebsites } = await req.json() as DiscoveryRequest

    const leads: any[] = []

    // Handle finding businesses without websites via Google Places API
    if (findWithoutWebsites && query && location) {
      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY')

      if (!GOOGLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Google API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Finding businesses without websites:', query, location)

      // Use Places API (New) - Text Search
      const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.types,places.businessStatus'
        },
        body: JSON.stringify({
          textQuery: `${query} in ${location}`,
          maxResultCount: Math.min(limit * 3, 20) // Request more to account for filtering
        })
      })

      const searchData = await searchResponse.json()

      if (searchData.error) {
        console.error('Places API error:', searchData.error)
        return new Response(
          JSON.stringify({ error: searchData.error.message || 'Places API error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const places = searchData.places || []
      console.log(`Found ${places.length} places, checking for websites...`)

      let processed = 0
      let withWebsite = 0
      let withoutWebsite = 0
      const errors: string[] = []
      const debugInfo: string[] = []

      for (const place of places) {
        if (processed >= limit) break

        // Skip if business has a website
        if (place.websiteUri) {
          withWebsite++
          console.log(`Skipping ${place.displayName?.text} - has website: ${place.websiteUri}`)
          continue
        }

        withoutWebsite++

        const businessName = place.displayName?.text || 'Unknown Business'
        const businessAddress = place.formattedAddress || ''
        const businessPhone = place.nationalPhoneNumber || null
        const businessCategory = place.types?.[0]?.replace(/_/g, ' ') || query

        // Log business status for debugging
        debugInfo.push(`${businessName} (Status: ${place.businessStatus || 'not set'})`)

        // Check if this business already exists (by name + address)
        const { data: existing } = await supabaseClient
          .from('automation_leads')
          .select('id')
          .eq('business_name', businessName)
          .eq('business_address', businessAddress)
          .maybeSingle()

        if (existing) {
          debugInfo.push(`  -> Skipped: already exists`)
          continue
        }

        debugInfo.push(`  -> Inserting...`)

        // Create lead for business without website
        const { data: lead, error } = await supabaseClient
          .from('automation_leads')
          .insert({
            business_name: businessName,
            business_url: null,  // No website!
            business_phone: businessPhone,
            business_address: businessAddress,
            business_category: businessCategory,
            source: 'google_places',
            source_query: query,
            source_location: location,
            workflow_status: 'discovered',
            analysis_status: 'not_applicable',  // Can't analyze - no website
            generation_status: 'pending',
            needs_refresh: true,  // They need a website!
            refresh_reasons: ['Business has no website'],
            discovered_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          errors.push(`${businessName}: ${error.message}`)
          debugInfo.push(`  -> ERROR: ${error.message}`)
        } else if (lead) {
          leads.push(lead)
          processed++
          debugInfo.push(`  -> SUCCESS`)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          leads,
          count: leads.length,
          totalFound: places.length,
          withWebsite,
          withoutWebsite,
          message: `Found ${places.length} businesses: ${withWebsite} have websites, ${withoutWebsite} don't. Added ${leads.length} new leads.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

      // Build search query - be more specific
      let searchQuery = query
      if (location) {
        searchQuery = `"${query}" ${location}`
      }
      // Add terms to find small businesses with websites
      searchQuery = `${searchQuery} local business`

      // Store original query terms for relevance checking
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)

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
                              'homeadvisor.com', 'houzz.com', 'nextdoor.com',
                              // Government sites
                              '.gov', 'state.sd.us', 'state.mn.us', 'state.nd.us', 'state.ia.us',
                              'state.ne.us', 'state.wy.us', 'state.mt.us', 'usa.gov',
                              // Legal/court sites
                              'justia.com', 'findlaw.com', 'avvo.com', 'lawyers.com',
                              'martindale.com', 'law.cornell.edu', 'casetext.com',
                              'courtlistener.com', 'leagle.com', 'casemine.com',
                              'dockets.justia.com', 'law.justia.com', 'uscode.house.gov',
                              // Directories and aggregators
                              'manta.com', 'chamberofcommerce.com', 'merchantcircle.com',
                              'superpages.com', 'whitepages.com', 'citysearch.com',
                              'mapquest.com', 'foursquare.com', 'tripadvisor.com',
                              // Educational
                              '.edu', 'mitchelltech.edu',
                              // News/media
                              'patch.com', 'argusleader.com', 'keloland.com', 'mykxlg.com',
                              'dakotanewsnow.com', 'kelo.com', 'ksfy.com',
                              // Job sites
                              'ziprecruiter.com', 'indeed.com', 'monster.com', 'glassdoor.com',
                              'careerbuilder.com', 'simplyhired.com', 'snagajob.com',
                              'jobs.com', 'joblist.com', 'jooble.org', 'neuvoo.com',
                              'kelolandemployment.com', 'readysethire.com', 'salary.com',
                              'payscale.com', 'comparably.com', 'levels.fyi',
                              // Review sites
                              'trustpilot.com', 'sitejabber.com', 'consumeraffairs.com',
                              'complaintsboard.com', 'pissedconsumer.com',
                              // Generic/aggregator sites
                              'craigslist.org', 'kijiji.ca', 'gumtree.com', 'olx.com',
                              'bizjournals.com', 'inc.com', 'forbes.com', 'entrepreneur.com']

          const url = new URL(item.link)
          const domain = url.hostname.replace('www.', '')
          const fullUrl = item.link.toLowerCase()

          // Skip if domain matches blocked list
          if (skipDomains.some(skip => domain.includes(skip) || fullUrl.includes(skip))) {
            continue
          }

          // Skip government TLDs
          if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
            continue
          }

          // Skip pages that look like legal documents, job listings, or news
          const skipKeywords = ['regulation', 'statute', 'ordinance', 'code of', 'legal notice',
                                 'court case', 'docket', 'filing', 'administrative rule',
                                 'state law', 'federal law', 'license lookup', 'verify license',
                                 // Job-related - comprehensive list
                                 'jobs in', 'job search', 'careers at', 'hiring', 'job openings',
                                 'salary', 'salaries', 'pay rate', 'hourly rate', 'wage', 'wages',
                                 'apply now', 'job listing', 'employment', 'apprentice',
                                 'job posting', 'now hiring', 'we are hiring', 'join our team',
                                 'career opportunities', 'job opportunities', 'open positions',
                                 'work for us', 'employee', 'employees', 'per hour', '/hr',
                                 'annual salary', 'compensation', 'benefits package', 'full-time',
                                 'part-time', 'job description', 'qualifications', 'requirements',
                                 'resume', 'cover letter', 'interview', 'recruiter', 'recruiting',
                                 'talent acquisition', 'workforce', 'staffing', 'temp agency',
                                 'how much do', 'how much does', 'average pay', 'median salary',
                                 'income', 'earning', 'earnings', 'make per', 'paid per',
                                 // News-related
                                 'news article', 'breaking news', 'press release']
          const titleLower = item.title.toLowerCase()
          const snippetLower = item.snippet.toLowerCase()

          if (skipKeywords.some(kw => titleLower.includes(kw) || snippetLower.includes(kw))) {
            continue
          }

          // Check relevance - at least one query term should appear in title, snippet, or URL
          const combinedText = `${titleLower} ${snippetLower} ${fullUrl}`
          const isRelevant = queryTerms.some(term => combinedText.includes(term))

          if (!isRelevant && queryTerms.length > 0) {
            console.log(`Skipping irrelevant result: ${item.title}`)
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
            const skipDomains2 = ['facebook.com', 'yelp.com', 'yellowpages.com', 'linkedin.com',
                                'google.com', 'maps.google.com', 'instagram.com', 'twitter.com',
                                'pinterest.com', 'youtube.com', 'amazon.com', 'ebay.com',
                                'wikipedia.org', 'bbb.org', 'angieslist.com', 'thumbtack.com',
                                'homeadvisor.com', 'houzz.com', 'nextdoor.com',
                                '.gov', 'state.sd.us', 'state.mn.us', 'state.nd.us', 'state.ia.us',
                                'state.ne.us', 'state.wy.us', 'state.mt.us', 'usa.gov',
                                'justia.com', 'findlaw.com', 'avvo.com', 'lawyers.com',
                                'martindale.com', 'law.cornell.edu', 'casetext.com',
                                'courtlistener.com', 'leagle.com', 'casemine.com',
                                'dockets.justia.com', 'law.justia.com', 'uscode.house.gov',
                                'manta.com', 'chamberofcommerce.com', 'merchantcircle.com',
                                'superpages.com', 'whitepages.com', 'citysearch.com',
                                'mapquest.com', 'foursquare.com', 'tripadvisor.com',
                                '.edu', 'mitchelltech.edu',
                                'patch.com', 'argusleader.com', 'keloland.com', 'mykxlg.com',
                                'dakotanewsnow.com', 'kelo.com', 'ksfy.com',
                                'ziprecruiter.com', 'indeed.com', 'monster.com', 'glassdoor.com',
                                'careerbuilder.com', 'simplyhired.com', 'snagajob.com',
                                'jobs.com', 'joblist.com', 'jooble.org', 'neuvoo.com',
                                'kelolandemployment.com', 'readysethire.com', 'salary.com',
                                'payscale.com', 'comparably.com', 'levels.fyi',
                                'trustpilot.com', 'sitejabber.com', 'consumeraffairs.com',
                                'complaintsboard.com', 'pissedconsumer.com',
                                'craigslist.org', 'kijiji.ca', 'gumtree.com', 'olx.com',
                                'bizjournals.com', 'inc.com', 'forbes.com', 'entrepreneur.com']

            const url = new URL(item.link)
            const domain = url.hostname.replace('www.', '')
            const fullUrl = item.link.toLowerCase()

            if (skipDomains2.some(skip => domain.includes(skip) || fullUrl.includes(skip))) {
              continue
            }

            if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
              continue
            }

            const skipKeywords2 = ['regulation', 'statute', 'ordinance', 'code of', 'legal notice',
                                   'court case', 'docket', 'filing', 'administrative rule',
                                   'state law', 'federal law', 'license lookup', 'verify license',
                                   // Job-related - comprehensive list
                                   'jobs in', 'job search', 'careers at', 'hiring', 'job openings',
                                   'salary', 'salaries', 'pay rate', 'hourly rate', 'wage', 'wages',
                                   'apply now', 'job listing', 'employment', 'apprentice',
                                   'job posting', 'now hiring', 'we are hiring', 'join our team',
                                   'career opportunities', 'job opportunities', 'open positions',
                                   'work for us', 'employee', 'employees', 'per hour', '/hr',
                                   'annual salary', 'compensation', 'benefits package', 'full-time',
                                   'part-time', 'job description', 'qualifications', 'requirements',
                                   'resume', 'cover letter', 'interview', 'recruiter', 'recruiting',
                                   'talent acquisition', 'workforce', 'staffing', 'temp agency',
                                   'how much do', 'how much does', 'average pay', 'median salary',
                                   'income', 'earning', 'earnings', 'make per', 'paid per',
                                   'news article', 'breaking news', 'press release']
            const titleLower = item.title.toLowerCase()
            const snippetLower = item.snippet.toLowerCase()

            if (skipKeywords2.some(kw => titleLower.includes(kw) || snippetLower.includes(kw))) {
              continue
            }

            const combinedText = `${titleLower} ${snippetLower} ${fullUrl}`
            const isRelevant = queryTerms.some(term => combinedText.includes(term))

            if (!isRelevant && queryTerms.length > 0) {
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
