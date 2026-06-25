// Supabase Edge Function: fulfill-order
// Called from the success page after Stripe redirects back.
// Verifies payment, creates the ticket record, sends confirmation email.
// Deploy: supabase functions deploy fulfill-order
// Env vars needed in Supabase Dashboard → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY   — sk_test_...
//   SUPABASE_URL        — auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase (bypasses RLS)
//   RESEND_API_KEY      — from resend.com
//   APP_URL             — https://on-stage-os.vercel.app
//   FROM_EMAIL          — tickets@yourdomain.com (must be verified in Resend)

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendTicketEmail(
  to: string,
  buyerName: string,
  eventName: string,
  tierName: string,
  ticketId: string,
) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const appUrl    = Deno.env.get('APP_URL') || 'https://on-stage-os.vercel.app'
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'tickets@onstageon.app'
  if (!resendKey) return // silently skip if not configured

  const ticketUrl = `${appUrl}/t/${ticketId}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#16140F;font-family:'Inter',sans-serif;color:#F6F2E7;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <p style="font-size:13px;color:#5A5544;margin-bottom:32px;">
      OnStage <span style="color:#E8893A">OS</span>
    </p>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;">
      You're going! 🎉
    </h1>
    <p style="font-size:15px;color:#9E9980;margin:0 0 32px;">
      Here's your ticket for <strong style="color:#F6F2E7">${eventName}</strong>.
    </p>

    <div style="background:#1E1B14;border:1px solid #332F25;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;">${eventName}</p>
      <p style="margin:0 0 16px;font-size:13px;color:#9E9980;">${tierName}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#5A5544;">Registered to</p>
      <p style="margin:0;font-size:14px;">${buyerName}</p>
    </div>

    <a href="${ticketUrl}"
       style="display:block;text-align:center;background:#E8893A;color:#16140F;text-decoration:none;
              font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;margin-bottom:16px;">
      View my ticket & QR code →
    </a>

    <p style="font-size:12px;color:#5A5544;text-align:center;margin:0;">
      Show the QR code at the door. No printing needed.
    </p>

    <p style="font-size:11px;color:#332F25;text-align:center;margin:32px 0 0;">
      Powered by OnStage OS · Cape Town
    </p>
  </div>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: `Your ticket for ${eventName}`,
      html,
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Idempotency: if a ticket already exists for this session, return it
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('stripe_session_id', session_id)
      .maybeSingle()

    if (existing?.id) {
      return new Response(
        JSON.stringify({ ticket_id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const ticketTypeId = session.metadata?.ticket_type_id
    const buyerName    = session.metadata?.buyer_name || null
    const buyerEmail   = session.customer_email || session.metadata?.buyer_email || null
    const amountPaid   = session.amount_total ? session.amount_total / 100 : null

    if (!ticketTypeId) {
      return new Response(
        JSON.stringify({ error: 'Missing ticket_type_id in session metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Create the ticket
    const { data: ticket, error: insertErr } = await supabase
      .from('tickets')
      .insert({
        ticket_type_id:    ticketTypeId,
        status:            'valid',
        buyer_name:        buyerName,
        buyer_email:       buyerEmail,
        stripe_session_id: session_id,
        amount_paid:       amountPaid,
      })
      .select()
      .single()

    if (insertErr || !ticket) {
      throw new Error(insertErr?.message || 'Failed to create ticket')
    }

    // Increment quantity_sold on the ticket type
    await supabase.rpc('increment_ticket_sold', { type_id: ticketTypeId })

    // Send confirmation email (fire-and-forget)
    if (buyerEmail) {
      const { data: tt } = await supabase
        .from('ticket_types')
        .select('name, events(name)')
        .eq('id', ticketTypeId)
        .maybeSingle()
      const tierName  = (tt as { name: string } | null)?.name ?? 'Ticket'
      const eventData = (tt as { events: { name: string } | null } | null)?.events
      const eventName = eventData?.name ?? 'the event'
      await sendTicketEmail(buyerEmail, buyerName ?? 'Guest', eventName, tierName, ticket.id)
    }

    return new Response(
      JSON.stringify({ ticket_id: ticket.id }),
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
