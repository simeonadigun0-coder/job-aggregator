import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResumeUpload from '@/components/ResumeUpload'
import SignOutButton from '@/components/SignOutButton'
import NewsPanel from '@/components/NewsPanel'
import MessagesPanel from '@/components/MessagesPanel'
import RefreshButton from '@/components/RefreshButton'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import TrialBanner from '@/components/TrialBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = (profile as any)?.is_exempt || false

  // Job counts
  const { count: totalJobs } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })

  const { count: nigerianCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .eq('country', 'Nigeria')

  const { count: remoteCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .eq('job_type', 'remote')
    .neq('country', 'Nigeria')

  const { count: hybridCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .eq('job_type', 'hybrid')

  // Strong matches for this user
  const { count: strongMatchCount } = await supabase
    .from('job_matches').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_strong_match', true)
    .neq('status', 'dismissed')

  const statCards = [
    { label: 'Total Jobs', value: totalJobs || 0, href: '/jobs/all', color: '#e8dcc8', emoji: '🌐' },
    { label: 'Strong Matches', value: strongMatchCount || 0, href: '/jobs/all', color: '#c9a84c', emoji: '★' },
    { label: 'Nigerian Jobs', value: nigerianCount || 0, href: '/jobs/nigerian', color: '#4ade80', emoji: '🇳🇬' },
    { label: 'Remote', value: remoteCount || 0, href: '/jobs/remote', color: '#7a9ac0', emoji: '🌍' },
    { label: 'Hybrid', value: hybridCount || 0, href: '/jobs/hybrid', color: '#9a7ac0', emoji: '🏢' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      {/* Header */}
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
              <span className="text-sm font-bold text-black">J</span>
            </div>
            <div>
              <span className="font-semibold tracking-widest text-xs uppercase"
                style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
              <span className="hidden sm:inline text-xs ml-2 px-2 py-0.5 rounded-full"
                style={{ background: '#1a2235', color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                {(profile as any)?.display_name || 'Dashboard'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh only visible to admin */}
            {isAdmin && <RefreshButton />}
            <Link href="/profile"
              className="text-xs px-3 py-1.5 rounded-lg tracking-wider uppercase"
              style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">👤</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Trial banner */}
        <TrialBanner />

        {/* Resume upload */}
        <ResumeUpload currentFilename={(profile as any)?.resume_filename || null} />

        {/* No resume warning */}
        {!(profile as any)?.resume_text && (
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: '#1a1500', border: '1px solid #c9a84c44' }}>
            <span className="text-base shrink-0" style={{ color: '#c9a84c' }}>!</span>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#c9a84c' }}>
                Upload your resume to activate job matching
              </p>
              <p className="text-xs" style={{ color: '#8a7a5a' }}>
                Once uploaded, every job is scored against your profile automatically.
              </p>
            </div>
          </div>
        )}

        {/* Clickable stat cards */}
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#6b7a99', letterSpacing: '0.15em' }}>Browse Jobs</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map(card => (
              <Link key={card.label} href={card.href}
                className="rounded-xl p-4 flex flex-col gap-2 transition-all group"
                style={{ background: '#111827', border: '1px solid #1e2d4a', textDecoration: 'none' }}
                onMouseEnter={undefined}>
                <div className="flex items-center justify-between">
                  <span className="text-base">{card.emoji}</span>
                  <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: '#c9a84c' }}>View →</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="text-xs" style={{ color: '#6b7a99' }}>{card.label}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Auto-apply setup prompt */}
        {!(profile as any)?.auto_apply_enabled && (profile as any)?.resume_text && (
          <div className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#e8dcc8' }}>Enable Auto-Apply</p>
              <p className="text-xs" style={{ color: '#6b7a99' }}>
                Set up your cover letter and Gmail to apply to jobs automatically.
              </p>
            </div>
            <Link href="/profile"
              className="text-xs font-semibold px-4 py-2.5 rounded-lg tracking-wider uppercase shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
              Set Up
            </Link>
          </div>
        )}

        {/* Inbox */}
        <MessagesPanel />

        {/* Market Intelligence */}
        <NewsPanel />

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 mt-4">
        <div className="flex items-center justify-between"
          style={{ borderTop: '1px solid #1e2d4a', paddingTop: '1.5rem' }}>
          <span className="text-xs tracking-widest uppercase"
            style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
          <span className="text-xs" style={{ color: '#2a3a55' }}>Refreshes every 30 minutes</span>
        </div>
      </footer>

      <PWAInstallBanner />
    </div>
  )
}
