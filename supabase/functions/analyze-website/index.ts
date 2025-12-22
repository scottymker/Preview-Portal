import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  leadId: string
}

interface ClaudeAnalysis {
  design_score: number
  needs_refresh: boolean
  refresh_confidence: number
  refresh_reasons: string[]
  business_name: string | null
  business_category: string | null
  business_description: string | null
  business_phone: string | null
  business_email: string | null
  business_address: string | null
  business_services: string[]
  extracted_colors: string[]
  design_issues: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { leadId } = await req.json() as AnalysisRequest

    // Get the lead
    const { data: lead, error: leadError } = await supabaseClient
      .from('automation_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to analyzing
    await supabaseClient
      .from('automation_leads')
      .update({ analysis_status: 'analyzing' })
      .eq('id', leadId)

    console.log('Analyzing website:', lead.business_url)

    // Fetch the website HTML
    let html = ''
    let sslStatus = false

    try {
      const url = new URL(lead.business_url)
      sslStatus = url.protocol === 'https:'

      const response = await fetch(lead.business_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      html = await response.text()

      // Truncate HTML to avoid token limits (keep first ~50KB)
      if (html.length > 50000) {
        html = html.substring(0, 50000) + '...[truncated]'
      }

    } catch (fetchError) {
      console.error('Failed to fetch website:', fetchError)

      await supabaseClient
        .from('automation_leads')
        .update({
          analysis_status: 'failed',
          analysis_error: `Failed to fetch website: ${fetchError.message}`
        })
        .eq('id', leadId)

      return new Response(
        JSON.stringify({ error: `Failed to fetch website: ${fetchError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude API to analyze the website
    const analysisPrompt = `You are a web design expert analyzing a small business website to determine if it needs a modern refresh.

Analyze this HTML and provide a JSON response with the following structure:
{
  "design_score": <0-100 integer, where 100 is modern/professional>,
  "needs_refresh": <boolean, true if score < 70 or has major issues>,
  "refresh_confidence": <0-100 integer, how confident you are>,
  "refresh_reasons": [<list of specific reasons why it needs refresh, or empty if good>],
  "business_name": <extracted business name or null>,
  "business_category": <e.g., "plumber", "restaurant", "lawyer", etc. or null>,
  "business_description": <brief description of what the business does or null>,
  "business_phone": <extracted phone number or null>,
  "business_email": <extracted email or null>,
  "business_address": <extracted address or null>,
  "business_services": [<list of services offered>],
  "extracted_colors": [<main brand colors in hex format>],
  "design_issues": [<specific design problems found>]
}

Design red flags that indicate refresh needed:
- No responsive/mobile meta viewport
- Uses tables for layout
- Inline styles everywhere
- Flash or deprecated tech
- Copyright date more than 2 years old
- No SSL (we'll check separately)
- Cluttered/busy design
- Poor typography
- Low contrast text
- Broken images or links
- Generic stock photos
- No clear call-to-action
- Slow loading indicators (many large images)
- Outdated design patterns (gradient buttons, shadows, etc)

Design green flags (modern):
- Clean, minimal layout
- Responsive design
- Modern CSS (flexbox, grid)
- Clear navigation
- Professional imagery
- Consistent branding
- Fast-loading structure
- Accessibility features
- Clear contact info
- Social proof (reviews, testimonials)

IMPORTANT: Respond with ONLY the JSON object, no other text.

Website URL: ${lead.business_url}

HTML Content:
${html}`

    console.log('Calling Claude API for analysis...')

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const analysisText = claudeData.content[0]?.text || '{}'

    console.log('Claude response:', analysisText)

    // Parse the JSON response
    let analysis: ClaudeAnalysis
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      analysis = {
        design_score: 50,
        needs_refresh: true,
        refresh_confidence: 50,
        refresh_reasons: ['Unable to fully analyze website'],
        business_name: lead.business_name,
        business_category: null,
        business_description: null,
        business_phone: null,
        business_email: null,
        business_address: null,
        business_services: [],
        extracted_colors: [],
        design_issues: ['Analysis parsing failed']
      }
    }

    // Check for basic mobile responsiveness in HTML
    const hasViewport = html.includes('viewport')
    const hasMediaQueries = html.includes('@media') || html.includes('media=')
    let mobileScore = 50
    if (hasViewport && hasMediaQueries) {
      mobileScore = 80
    } else if (hasViewport || hasMediaQueries) {
      mobileScore = 60
    } else {
      mobileScore = 30
    }

    // Update lead with analysis results
    const updateData = {
      analysis_status: 'completed',
      analysis_error: null,
      design_score: analysis.design_score,
      mobile_score: mobileScore,
      ssl_status: sslStatus,
      needs_refresh: analysis.needs_refresh,
      refresh_confidence: analysis.refresh_confidence,
      refresh_reasons: analysis.refresh_reasons,
      business_name: analysis.business_name || lead.business_name,
      business_category: analysis.business_category,
      business_description: analysis.business_description || lead.business_description,
      business_phone: analysis.business_phone,
      business_email: analysis.business_email,
      business_address: analysis.business_address,
      business_services: analysis.business_services,
      extracted_colors: analysis.extracted_colors,
      workflow_status: 'analyzed'
    }

    const { data: updatedLead, error: updateError } = await supabaseClient
      .from('automation_leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update lead:', updateError)
      throw updateError
    }

    console.log('Analysis complete for:', lead.business_url)

    return new Response(
      JSON.stringify({
        success: true,
        lead: updatedLead,
        analysis: {
          design_score: analysis.design_score,
          mobile_score: mobileScore,
          ssl_status: sslStatus,
          needs_refresh: analysis.needs_refresh,
          refresh_reasons: analysis.refresh_reasons,
          design_issues: analysis.design_issues
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Analysis error:', error)

    // Try to update lead with error status
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { leadId } = await req.json()
      if (leadId) {
        await supabaseClient
          .from('automation_leads')
          .update({
            analysis_status: 'failed',
            analysis_error: error.message
          })
          .eq('id', leadId)
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
