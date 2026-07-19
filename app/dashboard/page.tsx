/* eslint-disable */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import ResumeUpload from '@/components/ResumeUpload'
import MessagesPanel from '@/components/MessagesPanel'
import NewsPanel from '@/components/NewsPanel'
import TrialBanner from '@/components/TrialBanner'
import OnboardingModal from '@/components/OnboardingModal'
import SetupChecklist from '@/components/SetupChecklist'
import ProfileCompletionBar from '@/components/ProfileCompletionBar'
import RefreshButton from '@/components/RefreshButton'
import PWAInstallBanner from '@/components/PWAInstallBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile — defaults safely if the query fails or a column is missing
  let profile: Record<string, any> | null = null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, resume_filename, resume_text, auto_apply_enabled, is_exempt')
      .eq('id', user.id)
      .single()
    profile = data
  } catch {}

  const isAdmin = profile?.is_exempt || false

  // Job counts — every query isolated in its own try/catch so one failure
  // (e.g. a table not existing yet) never takes the whole page down
  const now = new Date()
  const cutoff23h = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()
  const cutoff5d = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

  let totalJobs = 0, nigerianCount = 0, remoteCount = 0, hybridCount = 0
  let archivedCount = 0, strongMatchCount = 0, savedCount = 0, applicationsCount = 0

  try {
    const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }).gte('fetched_at', cutoff23h)
    totalJobs = r.count || 0
  } catch {}
  try {
    const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('country', 'Nigeria').gte('fetched_at', cutoff23h)
    nigerianCount = r.count || 0
  } catch {}
  try {
    const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('job_type', 'remote').neq('country', 'Nigeria').gte('fetched_at', cutoff23h)
    remoteCount = r.count || 0
  } catch {}
  try {
    const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('job_type', 'hybrid').gte('fetched_at', cutoff23h)
    hybridCount = r.count || 0
  } catch {}
  try {
    const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }).lt('fetched_at', cutoff23h).gte('fetched_at', cutoff5d)
    archivedCount = r.count || 0
  } catch {}
  try {
    const r = await supabase.from('job_matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_strong_match', true).neq('status', 'dismissed')
    strongMatchCount = r.count || 0
  } catch {}
  try {
    const r = await supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    savedCount = r.count || 0
  } catch {}
  try {
    const [appsR, appliedMatchesR] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('job_matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'applied'),
    ])
    applicationsCount = (appsR.count || 0) + (appliedMatchesR.count || 0)
  } catch {}

  const displayName = profile?.display_name || ''
  const firstName = displayName.split(' ')[0] || 'Welcome'
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const cards = [
    { emoji: '🌐', label: 'Total Jobs', value: totalJobs, href: '/jobs/all', color: '#e8dcc8', desc: 'All active listings' },
    { emoji: '★', label: 'Strong Matches', value: strongMatchCount, href: '/jobs/all', color: '#c9a84c', desc: 'Best fits for you' },
    { emoji: '🇳🇬', label: 'Nigerian Jobs', value: nigerianCount, href: '/jobs/nigerian', color: '#4ade80', desc: 'Local opportunities' },
    { emoji: '🌍', label: 'Remote', value: remoteCount, href: '/jobs/remote', color: '#7a9ac0', desc: 'Work from anywhere' },
    { emoji: '🏢', label: 'Hybrid', value: hybridCount, href: '/jobs/hybrid', color: '#9a7ac0', desc: 'Part remote' },
    { emoji: '🔖', label: 'Saved Jobs', value: savedCount, href: '/jobs/saved', color: '#6b7a99', desc: 'Bookmarked for later' },
    { emoji: '📋', label: 'Applications', value: applicationsCount, href: '/applications', color: '#9a7ac0', desc: 'Track what you sent' },
    { emoji: '📦', label: 'Archived', value: archivedCount, href: '/jobs/archived', color: '#3a4a6a', desc: 'Older than 23 hours' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#060912' }}>

      {/* Header */}
      <header style={{ background: '#0a0e1a', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
              <span className="text-sm font-bold text-black">J</span>
            </div>
            <span className="font-bold tracking-widest text-sm uppercase hidden sm:block"
              style={{ color: '#c9a84c', letterSpacing: '0.25em' }}>JobHunt</span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {[
              { label: 'All Jobs', href: '/jobs/all' },
              { label: 'Nigerian', href: '/jobs/nigerian' },
              { label: 'Remote', href: '/jobs/remote' },
              { label: 'Hybrid', href: '/jobs/hybrid' },
              { label: 'Archive', href: '/jobs/archived' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ color: '#6b7a99', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && <RefreshButton />}
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#6b7a99', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">👤</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #0d1526 0%, #060912 100%)', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <TrialBanner />
          <div className="mt-4">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>Overview</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>
              {greeting}{displayName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-sm mb-4" style={{ color: '#6b7a99' }}>
              {totalJobs} fresh jobs available right now. Updated every 30 minutes.
            </p>
            <Link href="/search"
              className="flex items-center gap-3 w-full max-w-xl px-4 py-3 rounded-xl"
              style={{ background: '#111827', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              <span className="text-base">🔍</span>
              <span className="text-sm flex-1" style={{ color: '#3a4a6a' }}>Search job title, skill, or company...</span>
              <span className="text-xs px-2 py-1 rounded-lg hidden sm:block"
                style={{ background: '#1a2235', color: '#6b7a99', border: '1px solid #1e2d4a' }}>Search</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 page-enter">

        <SetupChecklist />
        <ProfileCompletionBar />

        {/* Job cards */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#3a4a6a', letterSpacing: '0.15em' }}>Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-start stagger-children">
            {cards.map(card => (
              <Link key={card.label} href={card.href}
                className="rounded-2xl p-5 flex flex-col gap-3 group"
                style={{ background: '#0d1526', border: '1px solid #1e2d4a', textDecoration: 'none',
                  transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease, border-color 0.2s ease' }}>
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="text-[10px] opacity-0 group-hover:opacity-100 font-medium"
                    style={{ color: '#c9a84c', transition: 'opacity 0.2s ease' }}>View →</span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: card.color }}>
                    {card.value.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: '#e8dcc8' }}>{card.label}</div>
                  <div className="text-[11px]" style={{ color: '#3a4a6a' }}>{card.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Resume */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#3a4a6a', letterSpacing: '0.15em' }}>Your Resume</h2>
          <ResumeUpload currentFilename={profile?.resume_filename || null} />
          {!profile?.resume_text && (
            <div className="mt-3 rounded-xl p-4 flex items-start gap-3"
              style={{ background: '#1a1500', border: '1px solid #c9a84c44' }}>
              <span className="text-sm shrink-0" style={{ color: '#c9a84c' }}>!</span>
              <p className="text-xs leading-relaxed" style={{ color: '#8a7a5a' }}>
                Upload your CV to unlock job matching. We score every job against your profile automatically.
              </p>
            </div>
          )}
        </section>

        {/* Auto-apply promo */}
        {!profile?.auto_apply_enabled && profile?.resume_text && (
          <div className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #1a1500, #0d1526)', border: '1px solid #c9a84c33' }}>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#e8dcc8' }}>Apply to jobs automatically</p>
              <p className="text-xs leading-relaxed" style={{ color: '#8a7a5a' }}>
                Add your cover letter and Gmail. We tailor and send applications on your behalf — you review every letter first.
              </p>
            </div>
            <Link href="/profile"
              className="text-xs font-bold px-5 py-3 rounded-xl tracking-wider uppercase shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000', textDecoration: 'none' }}>
              Set Up Auto-Apply
            </Link>
          </div>
        )}

        {/* Inbox */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#3a4a6a', letterSpacing: '0.15em' }}>Inbox</h2>
          <MessagesPanel />
        </section>

        {/* News */}
        <NewsPanel />

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e2d4a', marginTop: '3rem' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
                <span className="text-xs font-bold text-black">J</span>
              </div>
              <span className="text-xs font-bold tracking-widest uppercase"
                style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/jobs/all" className="text-xs" style={{ color: '#3a4a6a', textDecoration: 'none' }}>All Jobs</Link>
              <Link href="/jobs/nigerian" className="text-xs" style={{ color: '#3a4a6a', textDecoration: 'none' }}>Nigerian</Link>
              <Link href="/jobs/remote" className="text-xs" style={{ color: '#3a4a6a', textDecoration: 'none' }}>Remote</Link>
              <Link href="/search" className="text-xs" style={{ color: '#3a4a6a', textDecoration: 'none' }}>Search</Link>
            </div>
            <p className="text-xs" style={{ color: '#2a3a55' }}>Updated every 30 minutes</p>
          </div>
        </div>
      </footer>

      <OnboardingModal />
      <PWAInstallBanner />
    </div>
  )
}
