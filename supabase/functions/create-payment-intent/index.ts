import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentIntentRequest {
  invoiceId: string
  customerEmail: string
  customerName: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured')
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    const { invoiceId, customerEmail, customerName }: PaymentIntentRequest = await req.json()

    if (!invoiceId) {
      throw new Error('Invoice ID is required')
    }

    // Fetch invoice from database
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      throw new Error('Invoice not found')
    }

    if (invoice.status === 'paid') {
      throw new Error('Invoice has already been paid')
    }

    // Create or retrieve Stripe customer
    let customerId = invoice.stripe_customer_id

    if (!customerId) {
      // Search for existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            invoice_id: invoiceId,
          },
        })
        customerId = customer.id
      }

      // Store customer ID on invoice
      await supabase
        .from('invoices')
        .update({ stripe_customer_id: customerId })
        .eq('id', invoiceId)
    }

    // Convert total to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(invoice.total * 100)

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        project_name: invoice.project_name,
      },
      description: `Invoice ${invoice.invoice_number} - ${invoice.project_name}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store payment intent ID on invoice
    await supabase
      .from('invoices')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_method: 'card'
      })
      .eq('id', invoiceId)

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Payment intent error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
