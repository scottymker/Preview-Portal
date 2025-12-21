import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvoiceEmailRequest {
  to: string
  clientName: string
  invoiceNumber: string
  projectName: string
  lineItems: Array<{ description: string; quantity: number; rate: number }>
  total: number
  dueDate: string
  notes?: string
  paymentUrl: string
  // New fields for templates and tracking
  invoiceId?: string
  templateId?: string
  templateSubject?: string
  templateBody?: string
}

// Generate a unique tracking ID (64 hex characters)
function generateTrackingId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Substitute template variables
function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value || '')
  }
  return result
}

// Wrap links for click tracking
function wrapLinksForTracking(html: string, trackingId: string, baseUrl: string): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      if (url.includes('track-email')) return match
      const trackUrl = `${baseUrl}/functions/v1/track-email-click?tid=${trackingId}&url=${encodeURIComponent(url)}`
      return `href="${trackUrl}"`
    }
  )
}

// Add tracking pixel before </body>
function addTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  const pixel = `<img src="${baseUrl}/functions/v1/track-email-open?tid=${trackingId}" width="1" height="1" style="display:none;visibility:hidden;" alt="" />`
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  return html + pixel
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      to,
      clientName,
      invoiceNumber,
      projectName,
      lineItems,
      total,
      dueDate,
      notes,
      paymentUrl,
      invoiceId,
      templateId,
      templateSubject,
      templateBody
    }: InvoiceEmailRequest = await req.json()

    // Get Supabase URL for tracking links
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Generate tracking ID
    const trackingId = generateTrackingId()

    const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Prepare template variables for substitution
    const variables: Record<string, string> = {
      client_name: clientName || 'there',
      project_name: projectName,
      invoice_number: invoiceNumber,
      invoice_amount: `$${total.toFixed(2)}`,
      due_date: formattedDate,
      preview_link: paymentUrl,
      custom_message: notes || '',
      current_date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    let htmlContent: string
    let emailSubject: string

    // Check if using custom template
    if (templateBody && templateSubject) {
      htmlContent = substituteVariables(templateBody, variables)
      emailSubject = substituteVariables(templateSubject, variables)
    } else {
      // Use default invoice template
      const lineItemsHtml = lineItems.map(item => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eef1f5; color: #374151; font-size: 14px;">
            ${item.description}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size: 14px; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eef1f5; color: #6b7280; font-size: 14px; text-align: right;">
            $${item.rate.toFixed(2)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eef1f5; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">
            $${(item.quantity * item.rate).toFixed(2)}
          </td>
        </tr>
      `).join('')

      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #eef1f5;">
              <img src="https://thedevside.com/logo.png" alt="The Dev Side" style="height: 80px; width: auto;" />
              <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px;">Invoice</p>
            </td>
          </tr>

          <!-- Invoice Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <table width="100%">
                <tr>
                  <td style="vertical-align: top;">
                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</p>
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">${invoiceNumber}</p>

                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Project</p>
                    <p style="margin: 0; color: #374151; font-size: 16px;">${projectName}</p>
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">${formattedDate}</p>

                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Bill To</p>
                    <p style="margin: 0; color: #374151; font-size: 16px;">${clientName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: #f0f7ff; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Amount Due</p>
                  </td>
                  <td style="text-align: right;">
                    <p style="margin: 0; color: #2563eb; font-size: 32px; font-weight: 700;">$${total.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${notes ? `
          <!-- Notes -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${notes}</p>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="${paymentUrl}" style="display: inline-block; padding: 16px 48px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                Pay Now
              </a>
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 14px;">
                Or visit: <a href="${paymentUrl}" style="color: #2563eb;">${paymentUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Questions? Reply to this email or contact us.
              </p>
              <p style="margin: 12px 0 0; color: #d1d5db; font-size: 12px;">
                &copy; ${new Date().getFullYear()} The Dev Side. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

      emailSubject = `Invoice ${invoiceNumber} - ${projectName}`
    }

    // Add tracking to email
    if (supabaseUrl) {
      htmlContent = wrapLinksForTracking(htmlContent, trackingId, supabaseUrl)
      htmlContent = addTrackingPixel(htmlContent, trackingId, supabaseUrl)
    }

    const textContent = `Invoice ${invoiceNumber}

Hi ${clientName},

Here's your invoice for ${projectName}.

Invoice Number: ${invoiceNumber}
Due Date: ${formattedDate}
Amount Due: $${total.toFixed(2)}

Line Items:
${lineItems.map(item => `- ${item.description}: ${item.quantity} x $${item.rate.toFixed(2)} = $${(item.quantity * item.rate).toFixed(2)}`).join('\n')}

${notes ? `Notes: ${notes}\n` : ''}
Pay online: ${paymentUrl}

Questions? Reply to this email or contact us.

Best regards,
The Dev Side`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'The Dev Side <onboarding@resend.dev>',
        to: [to],
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send invoice')
    }

    // Record the sent email in database for tracking
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)

        await supabase.from('sent_emails').insert({
          tracking_id: trackingId,
          template_id: templateId || null,
          recipient_email: to,
          recipient_name: clientName || null,
          subject: emailSubject,
          invoice_id: invoiceId || null,
          email_type: 'invoice',
          variables: variables
        })
      } catch (dbError) {
        console.error('Error recording sent email:', dbError)
      }
    }

    return new Response(JSON.stringify({ success: true, data, trackingId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
