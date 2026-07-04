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
import OnboardingModal from '@/components/OnboardingModal'
import SetupChecklist from '@/components/SetupChecklist'
import ProfileCompletionBar from '@/components/ProfileCompletionBar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const isAdmin = (profile as any)?.is_exempt || false

  const now = new Date()
  const cutoff23h = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()
  const cutoff5d = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

  // Active jobs — fetched in last 23 hours
  const { count: totalJobs } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .gte('fetched_at', cutoff23h)

  const { count: nigerianCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .eq('country', 'Nigeria').gte('fetched_at', cutoff23h)

  const { count: remoteCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .eq('job_type', 'remote').neq('country', 'Nigeria').gte('fetched_at', cutoff23h)

  const { count: hybridCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .eq('job_type', 'hybrid').gte('fetched_at', cutoff23h)

  // Archived — between 23hrs and 5 days
  const { count: archivedCount } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .lt('fetched_at', cutoff23h).gte('fetched_at', cutoff5d)

  const { count: strongMatchCount } = await supabase
    .from('job_matches').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_strong_match', true).neq('status', 'dismissed')

  // Yesterday's count for delta indicator
  const yesterday23h = new Date(now.getTime() - 47 * 60 * 60 * 1000).toISOString()
  const { count: yesterdayJobs } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })
    .gte('fetched_at', yesterday23h).lt('fetched_at', cutoff23h)

  // Saved jobs count
  const { count: savedCount } = await supabase
    .from('saved_jobs').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const delta = (totalJobs || 0) - (yesterdayJobs || 0)
  const deltaStr = delta > 0 ? `+${delta} since yesterday` : delta < 0 ? `${delta} since yesterday` : 'Same as yesterday'

  const jobCards = [
    { emoji: '🌐', label: 'Total Jobs', value: totalJobs || 0, href: '/jobs/all', color: '#e8dcc8', desc: deltaStr },
    { emoji: '★', label: 'Strong Matches', value: strongMatchCount || 0, href: '/jobs/all', color: '#c9a84c', desc: 'Best fits for your profile' },
    { emoji: '🇳🇬', label: 'Nigerian Jobs', value: nigerianCount || 0, href: '/jobs/nigerian', color: '#4ade80', desc: 'Local opportunities' },
    { emoji: '🌍', label: 'Remote', value: remoteCount || 0, href: '/jobs/remote', color: '#7a9ac0', desc: 'Work from anywhere' },
    { emoji: '🏢', label: 'Hybrid', value: hybridCount || 0, href: '/jobs/hybrid', color: '#9a7ac0', desc: 'Part remote' },
    { emoji: '🔖', label: 'Saved Jobs', value: savedCount || 0, href: '/jobs/saved', color: '#6b7a99', desc: 'Bookmarked for later' },
    { emoji: '📦', label: 'Archived', value: archivedCount || 0, href: '/jobs/archived', color: '#3a4a6a', desc: 'Older than 23 hours' },
  ]

  const displayName = (profile as any)?.display_name || ''
  const firstName = displayName.split(' ')[0] || 'Welcome'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen" style={{ background: '#060912' }}>

      {/* Top nav */}
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

          {/* Nav links */}
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
                style={{ color: '#6b7a99' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && <RefreshButton />}
            <Link href="/profile"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">👤</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div style={{ background: 'linear-gradient(180deg, #0d1526 0%, #060912 100%)', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <TrialBanner />
          <div className="mt-4">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>
              Overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>
              {greeting}{displayName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-sm mb-4" style={{ color: '#6b7a99' }}>
              {totalJobs || 0} fresh jobs available right now. Updated every 30 minutes.
            </p>
            {!displayName && (
              <Link href="/profile" className="inline-flex items-center gap-1 mb-4 text-xs"
                style={{ color: '#c9a84c' }}>
                Complete your profile to personalise your experience →
              </Link>
            )}
            {/* Search bar */}
            <Link href="/search"
              className="flex items-center gap-3 w-full max-w-xl px-4 py-3 rounded-xl transition-all"
              style={{ background: '#111827', border: '1px solid #1e2d4a', textDecoration: 'none' }}
              onMouseEnter={undefined}>
              <span className="text-base">🔍</span>
              <span className="text-sm flex-1" style={{ color: '#3a4a6a' }}>
                Search job title, skill, or company...
              </span>
              <span className="text-xs px-2 py-1 rounded-lg hidden sm:block"
                style={{ background: '#1a2235', color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                Search
              </span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Setup checklist for new users */}
        <SetupChecklist />

        {/* Profile completion bar */}
        <ProfileCompletionBar />

        {/* Job category cards */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#3a4a6a', letterSpacing: '0.15em' }}>Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {jobCards.map(card => (
              <Link key={card.label} href={card.href}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-all group"
                style={{
                  background: '#0d1526',
                  border: '1px solid #1e2d4a',
                  textDecoration: 'none',
                }}>
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-all font-medium"
                    style={{ color: '#c9a84c' }}>View all →</span>
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
          <ResumeUpload currentFilename={(profile as any)?.resume_filename || null} />
          {!(profile as any)?.resume_text && (
            <div className="mt-3 rounded-xl p-4 flex items-start gap-3"
              style={{ background: '#1a1500', border: '1px solid #c9a84c44' }}>
              <span className="text-sm shrink-0" style={{ color: '#c9a84c' }}>!</span>
              <p className="text-xs leading-relaxed" style={{ color: '#8a7a5a' }}>
                Upload your resume to see how well each job matches your profile. We score every job automatically.
              </p>
            </div>
          )}
        </section>

        {/* Auto-apply promo */}
        {!(profile as any)?.auto_apply_enabled && (profile as any)?.resume_text && (
          <div className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #1a1500, #0d1526)', border: '1px solid #c9a84c33' }}>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#e8dcc8' }}>Apply to jobs automatically</p>
              <p className="text-xs leading-relaxed" style={{ color: '#8a7a5a' }}>
                Add your cover letter template and Gmail. We tailor and send applications on your behalf.
                You review every letter before it goes out.
              </p>
            </div>
            <Link href="/profile"
              className="text-xs font-bold px-5 py-3 rounded-xl tracking-wider uppercase shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
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

        {/* Market Intelligence */}
        <section>
          <NewsPanel />
        </section>

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
              <Link href="/jobs/all" className="text-xs" style={{ color: '#3a4a6a' }}>All Jobs</Link>
              <Link href="/jobs/nigerian" className="text-xs" style={{ color: '#3a4a6a' }}>Nigerian</Link>
              <Link href="/jobs/remote" className="text-xs" style={{ color: '#3a4a6a' }}>Remote</Link>
              <Link href="/subscribe" className="text-xs" style={{ color: '#3a4a6a' }}>Subscribe</Link>
            </div>
            <p className="text-xs" style={{ color: '#2a3a55' }}>
              Updated every 30 minutes
            </p>
          </div>
        </div>
      </footer>

      <OnboardingModal />
      <PWAInstallBanner />
    </div>
  )
}
