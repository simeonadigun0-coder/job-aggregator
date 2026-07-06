/* eslint-disable */
'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  const loadProfile = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setEmail(user.email || '')

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, subscription_status, trial_ends_at, is_exempt')
      .eq('id', user.id)
      .single()

    if (!profile) return

    // Already active or exempt — go to dashboard
    if (profile.subscription_status === 'active' || profile.is_exempt) {
      router.push('/dashboard')
      return
    }

    setName(profile.display_name || '')

    if (profile.trial_ends_at) {
      const diff = new Date(profile.trial_ends_at).getTime() - Date.now()
      setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))))
    }
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function handlePay() {
    setLoading(true)
    // Load Paystack inline script dynamically
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => {
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_CODE,
        firstname: name.split(' ')[0] || '',
        lastname: name.split(' ').slice(1).join(' ') || '',
        currency: 'NGN',
        callback: function(response: { reference: string }) {
          // Verify on our server
          fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference }),
          }).then(() => {
            router.push('/dashboard')
          })
        },
        onClose: function() {
          setLoading(false)
        },
      })
      handler.openIframe()
    }
    document.head.appendChild(script)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>

      <div className="w-full max-w-md space-y-6 page-enter">
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
              <span className="text-base font-bold text-black">J</span>
            </div>
            <span className="font-semibold tracking-widest text-sm uppercase"
              style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 text-center space-y-6"
          style={{ background: '#111827', border: '1px solid #1e2d4a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

          {daysLeft !== null && daysLeft > 0 ? (
            <>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#e8dcc8' }}>
                Your trial is almost up
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7a99' }}>
                You have {daysLeft} day{daysLeft !== 1 ? 's' : ''} left. Subscribe to keep getting fresh jobs every day.
              </p>
            </>
          ) : (
            <>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #5a1a1a' }}>
                Trial ended
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#e8dcc8' }}>
                Subscribe to continue
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7a99' }}>
                Your free trial has ended. Subscribe to keep accessing daily jobs.
              </p>
            </>
          )}

          {/* Plan details */}
          <div className="rounded-xl p-5 text-left space-y-3"
            style={{ background: '#0a0e1a', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>Job Hunt Monthly</span>
              <span className="text-xl font-bold" style={{ color: '#c9a84c' }}>NGN 1,500<span className="text-xs font-normal" style={{ color: '#6b7a99' }}>/mo</span></span>
            </div>
            <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #1e2d4a' }}>
              {[
                'Fresh jobs every 30 minutes',
                'Nigerian and international roles',
                'Resume matching on every job',
                'Auto-apply with your cover letter',
                'Market intelligence news daily',
              ].map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#4ade80' }}>✓</span>
                  <span className="text-xs" style={{ color: '#6b7a99' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={loading || !email}
            className="w-full py-4 rounded-xl text-sm font-bold tracking-wider uppercase transition-all"
            style={{
              background: loading ? '#4a3a1a' : 'linear-gradient(135deg, #c9a84c, #8a6f2e)',
              color: loading ? '#8a7a4a' : '#000',
            }}
          >
            {loading ? 'Opening payment...' : 'Subscribe for NGN 1,500/month'}
          </button>

          {daysLeft !== null && daysLeft > 0 && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs w-full text-center"
              style={{ color: '#3a4a6a' }}
            >
              Continue with free trial
            </button>
          )}

          <p className="text-xs" style={{ color: '#2a3a55' }}>
            Secured by Paystack. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
