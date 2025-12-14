import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  clientName: string
  projectName: string
  previewUrl: string
  accessCode: string
  portalUrl: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, clientName, projectName, previewUrl, accessCode, portalUrl }: EmailRequest = await req.json()

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Website Preview is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #0d1117; border-radius: 16px; border: 1px solid rgba(0, 212, 255, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Preview Portal
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; color: #e8e8e8; font-size: 16px; line-height: 1.6;">
                Hi ${clientName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                Your website preview for <strong style="color: #00d4ff;">${projectName}</strong> is ready for review!
              </p>
            </td>
          </tr>

          <!-- Access Code Box -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #a0a0a0; font-size: 14px;">Your Access Code</p>
                    <p style="margin: 0; color: #00d4ff; font-size: 28px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">
                      ${accessCode.toUpperCase()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${previewUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #00b4d8); color: #0a0a0f; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px; margin-bottom: 12px;">
                View Your Preview
              </a>
              <p style="margin: 16px 0 0; color: #666666; font-size: 14px;">
                Or go to <a href="${portalUrl}" style="color: #00d4ff;">${portalUrl}</a> and enter your code
              </p>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 12px; color: #e8e8e8; font-size: 14px; font-weight: 600;">Once viewing the preview, you can:</p>
              <ul style="margin: 0; padding-left: 20px; color: #a0a0a0; font-size: 14px; line-height: 1.8;">
                <li>Switch between desktop, tablet, and mobile views</li>
                <li>Click "Add Comment" to leave feedback directly on the design</li>
                <li>Download your brand assets (if provided)</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(0, 212, 255, 0.1); text-align: center;">
              <p style="margin: 0; color: #666666; font-size: 14px;">
                Questions? Reply to this email or contact us.
              </p>
              <p style="margin: 16px 0 0; color: #666666; font-size: 12px;">
                &copy; ${new Date().getFullYear()} The Dev Side. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    const textContent = `Hi ${clientName || 'there'},

Your website preview for "${projectName}" is ready for review!

Access Code: ${accessCode.toUpperCase()}

View your preview: ${previewUrl}

Or go to ${portalUrl} and enter your code.

Once viewing the preview, you can:
- Switch between desktop, tablet, and mobile views
- Click "Add Comment" to leave feedback directly on the design
- Download your brand assets (if provided)

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
        from: 'Preview Portal <onboarding@resend.dev>',
        to: [to],
        subject: `Your ${projectName} Preview is Ready`,
        html: htmlContent,
        text: textContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, data }), {
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
