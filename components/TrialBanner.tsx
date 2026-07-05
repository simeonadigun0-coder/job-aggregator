/* eslint-disable */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [status, setStatus] = useState<string>('trial')
  const router = useRouter()

  const load = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, is_exempt')
      .eq('id', user.id)
      .single()

    if (!data || data.is_exempt || data.subscription_status === 'active') return

    setStatus(data.subscription_status)

    if (data.trial_ends_at) {
      const diff = new Date(data.trial_ends_at).getTime() - Date.now()
      setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))))
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (daysLeft === null || status === 'active') return null

  const isExpiringSoon = daysLeft <= 2

  return (
    <div className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: isExpiringSoon ? '#1a0a0a' : '#0d1526',
        border: `1px solid ${isExpiringSoon ? '#5a1a1a' : '#1e2d4a'}`,
      }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: isExpiringSoon ? '#f87171' : '#e8dcc8' }}>
          {daysLeft === 0
            ? 'Your free trial ends today'
            : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial`}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
          NGN 1,500/month to keep access after your trial
        </p>
      </div>
      <button
        onClick={() => router.push('/subscribe')}
        className="text-xs font-bold px-4 py-2.5 rounded-lg tracking-wider uppercase shrink-0"
        style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}
      >
        Subscribe
      </button>
    </div>
  )
}
