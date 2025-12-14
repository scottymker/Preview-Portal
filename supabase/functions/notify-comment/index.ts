import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@thedevside.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommentNotification {
  projectName: string
  projectToken: string
  authorName: string
  message: string
  xPosition: number
  yPosition: number
  previewUrl: string
  adminUrl: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectName, projectToken, authorName, message, xPosition, yPosition, previewUrl, adminUrl }: CommentNotification = await req.json()

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Comment on ${projectName}</title>
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
                New Comment
              </h1>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" style="background-color: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: #00ff88; font-size: 14px; font-weight: 600;">
                      New feedback on "${projectName}"
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Comment Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #a0a0a0; font-size: 12px;">FROM</p>
                    <p style="margin: 0 0 16px; color: #e8e8e8; font-size: 16px; font-weight: 600;">${authorName}</p>

                    <p style="margin: 0 0 8px; color: #a0a0a0; font-size: 12px;">POSITION</p>
                    <p style="margin: 0 0 16px; color: #00d4ff; font-size: 14px; font-family: monospace;">
                      X: ${Math.round(xPosition)}% | Y: ${Math.round(yPosition)}%
                    </p>

                    <p style="margin: 0 0 8px; color: #a0a0a0; font-size: 12px;">MESSAGE</p>
                    <p style="margin: 0; color: #e8e8e8; font-size: 16px; line-height: 1.6; padding: 16px; background-color: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                      "${message}"
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${adminUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #00b4d8); color: #0a0a0f; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                View in Admin Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(0, 212, 255, 0.1); text-align: center;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                &copy; ${new Date().getFullYear()} The Dev Side Preview Portal
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

    const textContent = `New Comment on "${projectName}"

From: ${authorName}
Position: X: ${Math.round(xPosition)}% | Y: ${Math.round(yPosition)}%

Message:
"${message}"

View in Admin Dashboard: ${adminUrl}

---
The Dev Side Preview Portal`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Preview Portal <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `New Comment on ${projectName} from ${authorName}`,
        html: htmlContent,
        text: textContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send notification')
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
