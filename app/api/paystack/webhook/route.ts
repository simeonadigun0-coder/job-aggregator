import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

const JOBHUNT_PLAN_CODE = 'PLN_dwcntdrwa2u1cst'
const GROOVESLIP_WEBHOOK = 'https://grooveslip-tau.vercel.app/api/paystack/webhook'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''

  // Verify signature using Paystack secret key
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const data = event.data || {}

  // Determine which app this event belongs to
  const planCode =
    data.plan?.plan_code ||
    data.plan_object?.plan_code ||
    data.subscription?.plan?.plan_code ||
    data.plan_code ||
    null

  const isJobHunt = planCode === JOBHUNT_PLAN_CODE

  // If no plan code or it's a JobHunt plan — handle here
  // If it's clearly not JobHunt — forward to Groove Slip
  if (!isJobHunt && planCode !== null) {
    // Forward to Groove Slip webhook
    try {
      await fetch(GROOVESLIP_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-paystack-signature': signature,
        },
        body,
      })
    } catch (err) {
      console.error('Failed to forward to Groove Slip:', err)
    }
    return NextResponse.json({ forwarded: true })
  }

  // Handle JobHunt events
  const supabase = createServiceClient()
  console.log('JobHunt webhook event:', event.event, 'plan:', planCode)

  switch (event.event) {
    case 'charge.success':
    case 'subscription.create': {
      const email = data.customer?.email || data.email
      if (!email) break

      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users.find((u: { email?: string }) => u.email === email)
      if (!user) break

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscribed_at: new Date().toISOString(),
        subscription_code: data.subscription_code || data.reference,
        paystack_customer_code: data.customer?.customer_code,
      }).eq('id', user.id)

      await supabase.from('subscription_events').insert({
        user_id: user.id,
        event_type: event.event === 'charge.success' ? 'charge_success' : 'subscription_created',
        paystack_event: event,
      })

      console.log('JobHunt subscription activated for:', email)
      break
    }

    case 'subscription.disable':
    case 'subscription.not_renew': {
      const email = data.customer?.email
      if (!email) break

      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users.find((u: { email?: string }) => u.email === email)
      if (!user) break

      await supabase.from('profiles').update({
        subscription_status: 'expired',
      }).eq('id', user.id)

      await supabase.from('subscription_events').insert({
        user_id: user.id,
        event_type: 'subscription_cancelled',
        paystack_event: event,
      })

      break
    }
  }

  return NextResponse.json({ received: true })
}
