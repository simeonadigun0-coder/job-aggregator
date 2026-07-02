'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error: signupError } = await supabase.auth.signUp({ email, password })
      if (signupError) { setError(signupError.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName || email.split('@')[0],
        })
      }
      router.push('/dashboard')
      router.refresh()
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) { setError(loginError.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 50%, #0d1526 100%)' }}>
      {/* Top bar */}
      <div className="border-b px-8 py-4 flex items-center justify-between" style={{ borderColor: '#1e2d4a' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
            <span className="text-xs font-bold text-black">J</span>
          </div>
          <span className="font-semibold tracking-widest text-xs uppercase" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
        </div>
        <span className="text-xs" style={{ color: '#6b7a99' }}>Private · Invite only</span>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Headline */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs tracking-widest uppercase" style={{ background: '#111827', border: '1px solid #1e2d4a', color: '#c9a84c' }}>
              For remote & hybrid job seekers
            </div>
            <h1 className="text-4xl font-bold mb-3 leading-tight" style={{ color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>
              Your Career,<br />
              <span style={{ color: '#c9a84c' }}>Curated Daily.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7a99' }}>
              Remote and hybrid opportunities from across the world,<br />matched to your resume every morning at 7AM.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{ background: '#111827', border: '1px solid #1e2d4a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            {/* Tab toggle */}
            <div className="flex rounded-lg p-1 mb-6" style={{ background: '#0a0e1a' }}>
              <button
                onClick={() => setMode('login')}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                style={mode === 'login'
                  ? { background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }
                  : { color: '#6b7a99' }}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                style={mode === 'signup'
                  ? { background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }
                  : { color: '#6b7a99' }}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Simeon Adigun"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8' }}
                    onFocus={e => e.target.style.borderColor = '#c9a84c'}
                    onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8' }}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                />
              </div>

              {/* Password with eye toggle */}
              <div>
                <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-lg text-sm outline-none transition-all"
                    style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8' }}
                    onFocus={e => e.target.style.borderColor = '#c9a84c'}
                    onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg transition-all"
                    style={{ color: showPassword ? '#c9a84c' : '#3a4a6a', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#1a0a0a', border: '1px solid #5a1a1a', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all mt-2"
                style={{
                  background: loading ? '#4a3a1a' : 'linear-gradient(135deg, #c9a84c, #8a6f2e)',
                  color: loading ? '#8a7a4a' : '#000',
                  letterSpacing: '0.1em'
                }}
              >
                {loading ? 'Authenticating...' : mode === 'login' ? 'Access Dashboard' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { value: '5+', label: 'Job Sources' },
              { value: 'Daily', label: 'Auto Refresh' },
              { value: 'AI', label: 'Resume Match' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-4 rounded-xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
                <div className="text-lg font-bold" style={{ color: '#c9a84c' }}>{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
