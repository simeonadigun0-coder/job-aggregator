import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResumeUpload from '@/components/ResumeUpload'
import JobCard from '@/components/JobCard'
import SignOutButton from '@/components/SignOutButton'
import NewsPanel from '@/components/NewsPanel'
import MessagesPanel from '@/components/MessagesPanel'
import RefreshButton from '@/components/RefreshButton'
import PWAInstallBanner from '@/components/PWAInstallBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // Total jobs in DB (for stats)
  const { count: totalJobs } = await supabase
    .from('jobs').select('*', { count: 'exact', head: true })

  // User's matches with job details
  const { data: matches } = await supabase
    .from('job_matches')
    .select(`
      id, match_score, match_reason, is_strong_match, status,
      jobs ( id, title, company, location, job_type, source, apply_url, posted_at, description, country )
    `)
    .eq('user_id', user.id)
    .neq('status', 'dismissed')
    .order('match_score', { ascending: false })
    .limit(200)

  type MatchRow = {
    id: string
    match_score: number
    match_reason: string | null
    is_strong_match: boolean
    status: string
    jobs: {
      id: string
      title: string
      company: string | null
      location: string | null
      job_type: string
      source: string
      apply_url: string | null
      posted_at: string | null
      description: string | null
      country: string | null
    }
  }

  const allMatches = (matches as unknown as MatchRow[]) || []
  const strongMatches = allMatches.filter(m => m.is_strong_match)

  // Segment: Nigerian vs Foreign jobs
  const nigerianMatches = allMatches.filter(m => m.jobs.country === 'Nigeria')
  const foreignMatches = allMatches.filter(m => m.jobs.country !== 'Nigeria')
  const remoteMatches = foreignMatches.filter(m => m.jobs.job_type === 'remote')
  const hybridMatches = foreignMatches.filter(m => m.jobs.job_type === 'hybrid')
  const otherForeignMatches = foreignMatches.filter(m => m.jobs.job_type !== 'remote' && m.jobs.job_type !== 'hybrid')

  const autoApplyEnabled = (profile as any)?.auto_apply_enabled || false

  function renderJobGrid(items: MatchRow[]) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {items.map((m: MatchRow) => (
          <JobCard
            key={m.id}
            matchId={m.id}
            jobId={m.jobs.id}
            title={m.jobs.title}
            company={m.jobs.company}
            location={m.jobs.location}
            jobType={m.jobs.job_type}
            source={m.jobs.source}
            applyUrl={m.jobs.apply_url}
            matchScore={m.match_score}
            matchReason={m.match_reason}
            isStrongMatch={m.is_strong_match}
            status={m.status}
            postedAt={m.jobs.posted_at}
            description={m.jobs.description}
            autoApplyEnabled={autoApplyEnabled}
          />
        ))}
      </div>
    )
  }

  function SectionHeader({ color, label, count, accent }: { color: string; label: string; count: number; accent?: string }) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-5 rounded-full" style={{ background: color }} />
        <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: accent || color, letterSpacing: '0.15em' }}>
          {label}
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: (accent || color) + '22', color: accent || color, border: `1px solid ${(accent || color)}44` }}>
          {count}
        </span>
      </div>
    )
  }

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
              <span className="font-semibold tracking-widest text-xs uppercase" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
              <span className="hidden sm:inline text-xs ml-2 px-2 py-0.5 rounded-full"
                style={{ background: '#1a2235', color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                {(profile as any)?.display_name || 'Dashboard'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton />
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Jobs', value: totalJobs || 0, accent: false },
            { label: 'Strong Matches', value: strongMatches.length, accent: true },
            { label: 'Nigerian Jobs', value: nigerianMatches.length, accent: false },
            { label: 'Remote / Hybrid', value: remoteMatches.length + hybridMatches.length, accent: false },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-4" style={{ background: '#111827', border: `1px solid ${stat.accent ? '#c9a84c44' : '#1e2d4a'}` }}>
              <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: stat.accent ? '#c9a84c' : '#e8dcc8' }}>{stat.value}</div>
              <div className="text-xs tracking-wide" style={{ color: '#6b7a99' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Resume */}
        <ResumeUpload currentFilename={(profile as any)?.resume_filename || null} />

        {/* No resume warning */}
        {!(profile as any)?.resume_text && (
          <div className="rounded-xl p-4 sm:p-5 flex items-start gap-4" style={{ background: '#1a1500', border: '1px solid #c9a84c44' }}>
            <span className="text-xl mt-0.5 shrink-0">!</span>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#c9a84c' }}>Resume required to activate matching</p>
              <p className="text-sm" style={{ color: '#8a7a5a' }}>
                Upload your resume above. New jobs are pulled every 30 minutes and scored against it automatically.
              </p>
            </div>
          </div>
        )}

        {/* Auto-apply setup prompt */}
        {!(profile as any)?.auto_apply_enabled && (profile as any)?.resume_text && (
          <div className="rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#e8dcc8' }}>Enable Auto-Apply</p>
              <p className="text-xs" style={{ color: '#6b7a99' }}>Set up your cover letter and Gmail to apply to jobs automatically.</p>
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

        {/* Strong Matches */}
        {strongMatches.length > 0 && (
          <section>
            <SectionHeader color="linear-gradient(#c9a84c, #8a6f2e)" accent="#c9a84c" label="Strong Matches" count={strongMatches.length} />
            {renderJobGrid(strongMatches)}
          </section>
        )}

        {/* Nigerian Jobs */}
        {nigerianMatches.length > 0 && (
          <section>
            <SectionHeader color="#2a7a4a" accent="#4ade80" label="🇳🇬 Nigerian Jobs" count={nigerianMatches.length} />
            {renderJobGrid(nigerianMatches)}
          </section>
        )}

        {/* Remote Jobs */}
        {remoteMatches.length > 0 && (
          <section>
            <SectionHeader color="#3a5a80" accent="#7a9ac0" label="🌍 Remote — International" count={remoteMatches.length} />
            {renderJobGrid(remoteMatches)}
          </section>
        )}

        {/* Hybrid Jobs */}
        {hybridMatches.length > 0 && (
          <section>
            <SectionHeader color="#5a3a80" accent="#9a7ac0" label="🏢 Hybrid — International" count={hybridMatches.length} />
            {renderJobGrid(hybridMatches)}
          </section>
        )}

        {/* Other Foreign */}
        {otherForeignMatches.length > 0 && (
          <section>
            <SectionHeader color="#1e2d4a" accent="#6b7a99" label="Other International" count={otherForeignMatches.length} />
            {renderJobGrid(otherForeignMatches)}
          </section>
        )}

        {/* Empty state */}
        {(profile as any)?.resume_text && allMatches.length === 0 && (
          <div className="text-center py-16 sm:py-20 rounded-2xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <div className="text-4xl mb-4">—</div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No jobs yet</p>
            <p className="text-sm mb-4" style={{ color: '#6b7a99' }}>Click the Refresh button above to pull the latest jobs now.</p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 mt-4">
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid #1e2d4a', paddingTop: '1.5rem' }}>
          <span className="text-xs tracking-widest uppercase" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
          <span className="text-xs" style={{ color: '#2a3a55' }}>Refreshes every 30 minutes</span>
        </div>
      </footer>
      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  )
}
