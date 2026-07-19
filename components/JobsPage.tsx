/* eslint-disable */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import JobCard from '@/components/JobCard'
import SignOutButton from '@/components/SignOutButton'
import AutoMatch from '@/components/AutoMatch'
import JobFilters from '@/components/JobFilters'

interface JobsPageProps {
  filter: 'all' | 'nigerian' | 'remote' | 'hybrid'
  title: string
  emoji: string
  searchParams?: { sort?: string; type?: string }
}

export default async function JobsPage({ filter, title, emoji, searchParams }: JobsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sortBy = searchParams?.sort || 'score'
  const typeFilter = searchParams?.type || 'all'

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, auto_apply_enabled, resume_text, resume_filename, gmail_address, gmail_app_password, cover_letter_template')
    .eq('id', user.id)
    .single()

  const cutoff23h = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  // First try to get user's personal matches
  const { data: matches } = await supabase
    .from('job_matches')
    .select(`
      id, match_score, match_reason, is_strong_match, status,
      jobs!inner ( id, title, company, location, job_type, source, apply_url, posted_at, description, country, fetched_at )
    `)
    .eq('user_id', user.id)
    .neq('status', 'dismissed')
    .gte('jobs.fetched_at', cutoff23h)
    .order('match_score', { ascending: false })
    .limit(200)

  type MatchRow = {
    id: string; match_score: number; match_reason: string | null
    is_strong_match: boolean; status: string
    jobs: {
      id: string; title: string; company: string | null; location: string | null
      job_type: string; source: string; apply_url: string | null; posted_at: string | null
      description: string | null; country: string | null
    }
  }

  type RawJob = {
    id: string; title: string; company: string | null; location: string | null
    job_type: string; source: string; apply_url: string | null; posted_at: string | null
    description: string | null; country: string | null
  }

  let displayMatches = (matches as unknown as MatchRow[]) || []

  // If user has no matches yet (new user), show all jobs as unscored
  if (displayMatches.length === 0) {
    let jobQuery = supabase
      .from('jobs')
      .select('id, title, company, location, job_type, source, apply_url, posted_at, description, country')
      .gte('fetched_at', cutoff23h)
      .order('posted_at', { ascending: false })
      .limit(100)

    if (filter === 'nigerian') jobQuery = jobQuery.eq('country', 'Nigeria')
    else if (filter === 'remote') jobQuery = jobQuery.eq('job_type', 'remote').neq('country', 'Nigeria')
    else if (filter === 'hybrid') jobQuery = jobQuery.eq('job_type', 'hybrid')

    const { data: rawJobs } = await jobQuery

    // Convert raw jobs into match-shaped objects with neutral scores
    displayMatches = ((rawJobs as unknown as RawJob[]) || []).map(job => ({
      id: `raw-${job.id}`,
      match_score: 0,
      match_reason: null,
      is_strong_match: false,
      status: 'new',
      jobs: job,
    }))
  } else {
    // Apply filter to existing matches
    if (filter === 'nigerian') {
      displayMatches = displayMatches.filter(m => m.jobs.country === 'Nigeria')
    } else if (filter === 'remote') {
      displayMatches = displayMatches.filter(m => m.jobs.job_type === 'remote' && m.jobs.country !== 'Nigeria')
    } else if (filter === 'hybrid') {
      displayMatches = displayMatches.filter(m => m.jobs.job_type === 'hybrid')
    }
  }

  // Apply type filter on top of category filter
  if (typeFilter !== 'all') {
    displayMatches = displayMatches.filter(m => m.jobs.job_type === typeFilter)
  }

  // Apply sort
  if (sortBy === 'date') {
    displayMatches = [...displayMatches].sort((a, b) =>
      new Date(b.jobs.posted_at || 0).getTime() - new Date(a.jobs.posted_at || 0).getTime()
    )
  }

  const hasResume = !!(profile as any)?.resume_text
  const hasAutoApplySetup = !!(profile as any)?.gmail_address &&
    !!(profile as any)?.gmail_app_password &&
    !!(profile as any)?.cover_letter_template
  const autoApplyEnabled = !!(profile as any)?.auto_apply_enabled && hasAutoApplySetup

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs" style={{ color: '#6b7a99' }}>← Dashboard</Link>
            <span style={{ color: '#1e2d4a' }}>|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
                <span className="text-xs font-bold text-black">J</span>
              </div>
              <span className="font-semibold tracking-widest text-xs uppercase hidden sm:block"
                style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobHunt</span>
            </div>
            <span style={{ color: '#1e2d4a' }}>|</span>
            <span className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>{emoji} {title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">👤</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4 page-enter">
        <AutoMatch />

        {/* Resume prompt */}
        {!hasResume && (
          <div className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: '#1a1500', border: '1px solid #c9a84c44' }}>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#c9a84c' }}>
                Upload your CV to see match scores
              </p>
              <p className="text-xs" style={{ color: '#8a7a5a' }}>
                We score every job against your profile so the best ones rise to the top.
              </p>
            </div>
            <Link href="/profile"
              className="text-xs font-semibold px-4 py-2.5 rounded-lg tracking-wider uppercase shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
              Upload CV
            </Link>
          </div>
        )}

        {/* Filters */}
        <JobFilters total={displayMatches.length} currentSort={sortBy} currentType={typeFilter} />

        {displayMatches.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No jobs yet</p>
            <p className="text-sm" style={{ color: '#6b7a99' }}>
              Jobs refresh automatically every 30 minutes. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 items-start stagger-children">
            {displayMatches.map((m: MatchRow) => (
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
        )}
      </main>
    </div>
  )
}
