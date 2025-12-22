import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerationRequest {
  leadId: string
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
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'GitHub token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { leadId } = await req.json() as GenerationRequest

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

    // Update status to generating
    await supabaseClient
      .from('automation_leads')
      .update({ generation_status: 'generating' })
      .eq('id', leadId)

    console.log('Generating website for:', lead.business_name || lead.business_url)

    // Generate site name from business name
    const siteName = (lead.business_name || 'business')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30) + '-' + Date.now().toString(36)

    // Build the generation prompt
    const businessInfo = {
      name: lead.business_name || 'Business Name',
      category: lead.business_category || 'Business',
      description: lead.business_description || '',
      phone: lead.business_phone || '(555) 123-4567',
      email: lead.business_email || 'contact@example.com',
      address: lead.business_address || '',
      services: lead.business_services || [],
      colors: lead.extracted_colors || []
    }

    const generationPrompt = `You are an expert web developer. Create a modern, responsive, single-page website for this small business.

BUSINESS INFORMATION:
- Name: ${businessInfo.name}
- Category: ${businessInfo.category}
- Description: ${businessInfo.description}
- Phone: ${businessInfo.phone}
- Email: ${businessInfo.email}
- Address: ${businessInfo.address}
- Services: ${businessInfo.services.join(', ') || 'Various services'}
- Brand Colors: ${businessInfo.colors.length > 0 ? businessInfo.colors.join(', ') : 'Use professional colors that fit the industry'}

REQUIREMENTS:
1. Create a complete, single HTML file with embedded CSS
2. Modern, clean, professional design
3. Fully responsive (mobile-first)
4. Include these sections:
   - Hero section with business name and tagline
   - About section
   - Services section (use the services provided or create relevant ones)
   - Contact section with phone, email, address
   - Footer
5. Use modern CSS (flexbox, grid, CSS variables)
6. Include a simple, professional color scheme
7. Add subtle animations/transitions
8. Include a "Request Quote" or "Contact Us" call-to-action button
9. Make phone numbers and emails clickable (tel: and mailto:)
10. Add Font Awesome icons via CDN
11. Add Google Fonts for professional typography

RESPOND WITH ONLY THE COMPLETE HTML CODE, nothing else. No explanations, no markdown code blocks - just the raw HTML starting with <!DOCTYPE html>.`

    console.log('Calling Claude API for website generation...')

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: generationPrompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    let htmlContent = claudeData.content[0]?.text || ''

    // Clean up the HTML if it has markdown code blocks
    htmlContent = htmlContent.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '')

    if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
      throw new Error('Invalid HTML generated')
    }

    console.log('Website generated, deploying to GitHub...')

    // Deploy to GitHub (same repo as preview portal)
    const GITHUB_REPO = 'scottymkerux/preview-deployment'
    const filePath = `public/sites/${siteName}/index.html`

    // Base64 encode the content
    const encoder = new TextEncoder()
    const contentBytes = encoder.encode(htmlContent)
    const base64Content = btoa(String.fromCharCode(...contentBytes))

    // Create or update file on GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PreviewPortal-Automation'
        },
        body: JSON.stringify({
          message: `Auto-generated site: ${businessInfo.name}`,
          content: base64Content,
          branch: 'main'
        })
      }
    )

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json()
      console.error('GitHub API error:', errorData)
      throw new Error(`GitHub deployment failed: ${errorData.message}`)
    }

    const previewUrl = `https://preview.thedevside.com/sites/${siteName}/`

    console.log('Website deployed to:', previewUrl)

    // Create a project in the preview portal
    const token = generateToken()
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .insert({
        token,
        name: `${businessInfo.name} - AI Generated`,
        preview_url: previewUrl,
        client_name: businessInfo.name,
        client_email: businessInfo.email !== 'contact@example.com' ? businessInfo.email : null
      })
      .select()
      .single()

    if (projectError) {
      console.error('Failed to create project:', projectError)
    }

    // Update lead with generation results
    const updateData = {
      generation_status: 'completed',
      generation_error: null,
      generated_site_name: siteName,
      generated_preview_url: previewUrl,
      project_id: project?.id || null,
      workflow_status: project ? 'ready_to_send' : 'generated'
    }

    const { data: updatedLead, error: updateError } = await supabaseClient
      .from('automation_leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update lead:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead: updatedLead,
        siteName,
        previewUrl,
        projectId: project?.id,
        projectToken: token
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Generation error:', error)

    // Try to update lead with error status
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const body = await req.clone().json()
      if (body.leadId) {
        await supabaseClient
          .from('automation_leads')
          .update({
            generation_status: 'failed',
            generation_error: error.message
          })
          .eq('id', body.leadId)
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateToken(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
