import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const supabase = createServiceClient()

  console.log('Paystack webhook:', event.event)

  switch (event.event) {
    case 'charge.success':
    case 'subscription.create': {
      const data = event.data
      const email = data.customer?.email || data.email

      if (!email) break

      // Find user by email
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users.find(u => u.email === email)
      if (!user) break

      // Activate subscription
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

      break
    }

    case 'subscription.disable':
    case 'subscription.not_renew': {
      const email = event.data.customer?.email
      if (!email) break

      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users.find(u => u.email === email)
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
