import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// User-triggered refresh — calls the cron endpoint internally
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://job-aggregator-gamma.vercel.app'
    const res = await fetch(`${baseUrl}/api/cron/fetch-jobs`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
