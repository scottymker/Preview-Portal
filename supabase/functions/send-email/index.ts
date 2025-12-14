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
  style?: 'dark' | 'light' | 'minimal'
}

// Style 1: Dark Tech (Original - Cyan/Green gradients on dark)
function getDarkTechTemplate(clientName: string, projectName: string, accessCode: string, previewUrl: string, portalUrl: string) {
  return `
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
        <table width="100%" style="max-width: 600px; background-color: #0d1117; border-radius: 16px; border: 1px solid rgba(0, 212, 255, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Preview Portal
              </h1>
              <p style="margin: 8px 0 0; color: #666; font-size: 14px;">by The Dev Side</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; color: #e8e8e8; font-size: 18px; line-height: 1.6;">
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
              <table width="100%" style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.1)); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #a0a0a0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Access Code</p>
                    <p style="margin: 0; color: #00d4ff; font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                      ${accessCode.toUpperCase()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${previewUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #00d4ff, #00ff88); color: #0a0a0f; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px;">
                View Your Preview
              </a>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px;">
                Or visit <a href="${portalUrl}" style="color: #00d4ff;">${portalUrl}</a> and enter your code
              </p>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 12px; color: #e8e8e8; font-size: 14px; font-weight: 600;">Once viewing the preview, you can:</p>
              <ul style="margin: 0; padding-left: 20px; color: #a0a0a0; font-size: 14px; line-height: 2;">
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
              <p style="margin: 16px 0 0; color: #444; font-size: 12px;">
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
}

// Style 2: Light Professional (Clean white with blue accents)
function getLightProfessionalTemplate(clientName: string, projectName: string, accessCode: string, previewUrl: string, portalUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Website Preview is Ready</title>
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
              <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px;">Preview Portal</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 18px; line-height: 1.5;">
                Hi ${clientName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Great news! Your website preview for <strong style="color: #2563eb;">${projectName}</strong> is ready for your review.
              </p>
            </td>
          </tr>

          <!-- Access Code Box -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: #f0f7ff; border: 2px solid #2563eb; border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Access Code</p>
                    <p style="margin: 0; color: #2563eb; font-size: 36px; font-weight: 800; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                      ${accessCode.toUpperCase()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${previewUrl}" style="display: inline-block; padding: 16px 48px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                View Your Preview
              </a>
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 14px;">
                Or visit <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">${portalUrl}</a> and enter your code
              </p>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: #fafbfc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: #374151; font-size: 14px; font-weight: 600;">What you can do:</p>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">
                          <span style="color: #2563eb; margin-right: 8px;">&#10003;</span>
                          Switch between desktop, tablet, and mobile views
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">
                          <span style="color: #2563eb; margin-right: 8px;">&#10003;</span>
                          Leave feedback directly on the design
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">
                          <span style="color: #2563eb; margin-right: 8px;">&#10003;</span>
                          Download your brand assets
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Questions? Simply reply to this email.
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
}

// Style 3: Minimal Elegant (Ultra-clean with subtle styling)
function getMinimalElegantTemplate(clientName: string, projectName: string, accessCode: string, previewUrl: string, portalUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Website Preview is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 60px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px;">
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 4px; color: #999;">The Dev Side</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 0 40px;">
              <p style="margin: 0 0 24px; color: #333; font-size: 20px; line-height: 1.6; font-weight: normal;">
                Hello ${clientName || 'there'},
              </p>
              <p style="margin: 0 0 32px; color: #666; font-size: 17px; line-height: 1.8;">
                Your preview for <em>${projectName}</em> is ready. Use the code below to access it.
              </p>
            </td>
          </tr>

          <!-- Access Code -->
          <tr>
            <td style="padding: 0 0 40px; text-align: center;">
              <p style="margin: 0 0 12px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Access Code</p>
              <p style="margin: 0; color: #000; font-size: 42px; font-weight: normal; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${accessCode.toUpperCase()}
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 0 50px; text-align: center;">
              <a href="${previewUrl}" style="display: inline-block; padding: 18px 50px; background-color: #000; color: #fff; text-decoration: none; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, sans-serif;">
                View Preview
              </a>
              <p style="margin: 24px 0 0; color: #999; font-size: 14px; font-family: -apple-system, sans-serif;">
                or enter your code at <a href="${portalUrl}" style="color: #666;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 0 40px;">
              <table width="100%" style="border-top: 1px solid #e5e5e5;"><tr><td></td></tr></table>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 0 50px;">
              <p style="margin: 0 0 20px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Features</p>
              <p style="margin: 0; color: #666; font-size: 15px; line-height: 2; font-family: -apple-system, sans-serif;">
                Responsive preview &nbsp;&middot;&nbsp; Direct feedback &nbsp;&middot;&nbsp; Asset downloads
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 0 0; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #ccc; font-size: 12px; font-family: -apple-system, sans-serif;">
                &copy; ${new Date().getFullYear()} The Dev Side
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function getTextContent(clientName: string, projectName: string, accessCode: string, previewUrl: string, portalUrl: string) {
  return `Hi ${clientName || 'there'},

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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, clientName, projectName, previewUrl, accessCode, portalUrl, style = 'dark' }: EmailRequest = await req.json()

    let htmlContent: string
    switch (style) {
      case 'light':
        htmlContent = getLightProfessionalTemplate(clientName, projectName, accessCode, previewUrl, portalUrl)
        break
      case 'minimal':
        htmlContent = getMinimalElegantTemplate(clientName, projectName, accessCode, previewUrl, portalUrl)
        break
      case 'dark':
      default:
        htmlContent = getDarkTechTemplate(clientName, projectName, accessCode, previewUrl, portalUrl)
        break
    }

    const textContent = getTextContent(clientName, projectName, accessCode, previewUrl, portalUrl)

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
