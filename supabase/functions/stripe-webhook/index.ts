import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe keys not configured')
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      throw new Error('No Stripe signature found')
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Received webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const invoiceId = paymentIntent.metadata.invoice_id

        if (!invoiceId) {
          console.error('No invoice_id in payment intent metadata')
          break
        }

        console.log('Payment succeeded for invoice:', invoiceId)

        // Update invoice status to paid
        const { data: invoice, error: updateError } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'card'
          })
          .eq('id', invoiceId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating invoice:', updateError)
          throw updateError
        }

        console.log('Invoice updated:', invoice)

        // Send confirmation email
        if (invoice && RESEND_API_KEY) {
          try {
            const formattedTotal = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(invoice.total)

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Logo Section -->
        <table width="100%" style="max-width: 600px; margin-bottom: 24px;">
          <tr>
            <td align="center">
              <img src="https://thedevside.com/logo.png" alt="The Dev Side" style="height: 40px; width: auto;" />
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table width="100%" style="max-width: 600px; background: linear-gradient(145deg, #1e293b, #0f172a); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <!-- Success Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%);">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
                <tr>
                  <td style="width: 72px; height: 72px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 32px; color: #ffffff; line-height: 72px;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; color: #f8fafc; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Payment Successful</h1>
              <p style="margin: 12px 0 0; color: #94a3b8; font-size: 16px;">Thank you for your payment, ${invoice.client_name}!</p>
            </td>
          </tr>

          <!-- Amount Section -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <table width="100%" style="background: linear-gradient(135deg, #1e3a5f, #0c4a6e); border-radius: 12px; border: 1px solid #0ea5e9;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; color: #7dd3fc; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Amount Paid</p>
                    <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; letter-spacing: -1px;">${formattedTotal}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <table width="100%">
                            <tr>
                              <td style="color: #94a3b8; font-size: 14px;">Invoice Number</td>
                              <td style="color: #f1f5f9; font-size: 14px; text-align: right; font-weight: 600;">${invoice.invoice_number}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <table width="100%">
                            <tr>
                              <td style="color: #94a3b8; font-size: 14px;">Project</td>
                              <td style="color: #f1f5f9; font-size: 14px; text-align: right; font-weight: 500;">${invoice.project_name}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <table width="100%">
                            <tr>
                              <td style="color: #94a3b8; font-size: 14px;">Payment Date</td>
                              <td style="color: #f1f5f9; font-size: 14px; text-align: right; font-weight: 500;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <table width="100%">
                            <tr>
                              <td style="color: #94a3b8; font-size: 14px;">Payment Method</td>
                              <td style="color: #f1f5f9; font-size: 14px; text-align: right; font-weight: 500;">
                                <span style="background: #334155; padding: 4px 10px; border-radius: 4px; font-size: 12px;">💳 Card</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receipt Notice -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.3);">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%">
                      <tr>
                        <td style="width: 24px; vertical-align: top;">
                          <span style="font-size: 16px;">📧</span>
                        </td>
                        <td style="color: #86efac; font-size: 14px; padding-left: 12px;">
                          A detailed receipt from Stripe has also been sent to your email.
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
            <td style="padding: 24px 40px; background-color: #0f172a; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                Questions about your payment?
              </p>
              <p style="margin: 0 0 16px;">
                <a href="mailto:hello@thedevside.com" style="color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: 500;">hello@thedevside.com</a>
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px;">
                © ${new Date().getFullYear()} The Dev Side. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

        <!-- Security Footer -->
        <table width="100%" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #475569; font-size: 12px;">
                🔒 Secured by Stripe
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

            const textContent = `Payment Received!

Thank you for your payment.

Invoice Number: ${invoice.invoice_number}
Project: ${invoice.project_name}
Amount Paid: ${formattedTotal}
Payment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

A receipt has been sent to your email by Stripe.

Questions? Reply to this email or contact us.

Best regards,
The Dev Side`

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: 'The Dev Side <onboarding@resend.dev>',
                to: [invoice.client_email],
                subject: `Payment Received - ${invoice.invoice_number}`,
                html: htmlContent,
                text: textContent,
              }),
            })

            console.log('Confirmation email sent to:', invoice.client_email)
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError)
            // Don't throw - payment was successful, email is secondary
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const invoiceId = paymentIntent.metadata.invoice_id

        if (invoiceId) {
          console.log('Payment failed for invoice:', invoiceId)

          // Optionally update invoice or log failure
          await supabase
            .from('invoices')
            .update({
              payment_method: 'failed'
            })
            .eq('id', invoiceId)
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
