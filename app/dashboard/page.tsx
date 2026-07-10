/* eslint-disable */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let displayName = 'there'
  try {
    const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    displayName = data?.display_name?.split(' ')[0] || 'there'
  } catch {}

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen" style={{ background: '#060912' }}>
      <header style={{ background: '#0a0e1a', borderBottom: '1px solid #1e2d4a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#c9a84c', fontWeight: 700, letterSpacing: '0.2em', fontSize: '14px' }}>JOBHUNT</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/profile" style={{ color: '#6b7a99', fontSize: '12px', textDecoration: 'none', border: '1px solid #1e2d4a', padding: '6px 12px', borderRadius: '8px' }}>Profile</Link>
          <SignOutButton />
        </div>
      </header>

      <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ color: '#e8dcc8', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          {greeting}, {displayName}.
        </h1>
        <p style={{ color: '#6b7a99', fontSize: '14px', marginBottom: '32px' }}>
          Your job dashboard is loading. Browse jobs below.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { emoji: '🌐', label: 'All Jobs', href: '/jobs/all', color: '#e8dcc8' },
            { emoji: '🇳🇬', label: 'Nigerian Jobs', href: '/jobs/nigerian', color: '#4ade80' },
            { emoji: '🌍', label: 'Remote', href: '/jobs/remote', color: '#7a9ac0' },
            { emoji: '🏢', label: 'Hybrid', href: '/jobs/hybrid', color: '#9a7ac0' },
            { emoji: '🔍', label: 'Search', href: '/search', color: '#c9a84c' },
            { emoji: '📦', label: 'Archived', href: '/jobs/archived', color: '#3a4a6a' },
          ].map(card => (
            <Link key={card.label} href={card.href} style={{
              background: '#0d1526', border: '1px solid #1e2d4a', borderRadius: '16px',
              padding: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <span style={{ fontSize: '24px' }}>{card.emoji}</span>
              <span style={{ color: card.color, fontSize: '14px', fontWeight: 600 }}>{card.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: '32px', padding: '20px', background: '#0d1526', border: '1px solid #1e2d4a', borderRadius: '16px' }}>
          <p style={{ color: '#e8dcc8', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Upload your CV</p>
          <p style={{ color: '#6b7a99', fontSize: '12px', marginBottom: '12px' }}>Go to Profile to upload your resume and activate job matching.</p>
          <Link href="/profile" style={{
            background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000',
            fontSize: '12px', fontWeight: 700, padding: '10px 20px', borderRadius: '8px',
            textDecoration: 'none', display: 'inline-block'
          }}>Go to Profile</Link>
        </div>
      </main>
    </div>
  )
}
