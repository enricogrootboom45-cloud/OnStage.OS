// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout Session and returns the URL.
// Deploy: supabase functions deploy create-checkout
// Env vars needed in Supabase Dashboard → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY   — sk_test_... (or sk_live_... for production)
//   APP_URL             — https://on-stage-os.vercel.app

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      ticket_type_id,
      event_name,
      ticket_name,
      price,
      buyer_name,
      buyer_email,
      success_url,
      cancel_url,
    } = await req.json()

    if (!ticket_type_id || !price || !success_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Convert ZAR to cents (Stripe uses smallest currency unit)
    const amountCents = Math.round(Number(price) * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: buyer_email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'zar',
            unit_amount: amountCents,
            product_data: {
              name: `${ticket_name} — ${event_name}`,
              description: `Ticket for ${event_name}`,
            },
          },
        },
      ],
      metadata: {
        ticket_type_id,
        buyer_name: buyer_name || '',
        buyer_email: buyer_email || '',
      },
      success_url,
      cancel_url,
    })

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
