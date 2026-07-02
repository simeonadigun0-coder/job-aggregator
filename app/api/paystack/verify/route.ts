import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference } = await request.json()
  if (!reference) return NextResponse.json({ error: 'No reference' }, { status: 400 })

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()

  if (!data.status || data.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 })
  }

  // Activate subscription
  const serviceClient = createServiceClient()
  await serviceClient.from('profiles').update({
    subscription_status: 'active',
    subscribed_at: new Date().toISOString(),
    paystack_customer_code: data.data?.customer?.customer_code,
  }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
