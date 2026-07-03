import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import JobCard from '@/components/JobCard'
import SignOutButton from '@/components/SignOutButton'
import AutoMatch from '@/components/AutoMatch'

interface JobsPageProps {
  filter: 'all' | 'nigerian' | 'remote' | 'hybrid'
  title: string
  emoji: string
}

export default async function JobsPage({ filter, title, emoji }: JobsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, auto_apply_enabled, resume_text')
    .eq('id', user.id)
    .single()

  // Get user's matches with time filter
  const cutoff23h = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  let query = supabase
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

  const { data: matches } = await query

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

  let allMatches = (matches as unknown as MatchRow[]) || []

  // Apply filter
  if (filter === 'nigerian') {
    allMatches = allMatches.filter(m => m.jobs.country === 'Nigeria')
  } else if (filter === 'remote') {
    allMatches = allMatches.filter(m => m.jobs.job_type === 'remote' && m.jobs.country !== 'Nigeria')
  } else if (filter === 'hybrid') {
    allMatches = allMatches.filter(m => m.jobs.job_type === 'hybrid')
  }

  const autoApplyEnabled = (profile as any)?.auto_apply_enabled || false

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      {/* Header */}
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs transition-all flex items-center gap-1"
              style={{ color: '#6b7a99' }}>
              ← Back
            </Link>
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
            <span className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>
              {emoji} {title}
            </span>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <AutoMatch />
        {/* Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#6b7a99' }}>
            {allMatches.length} job{allMatches.length !== 1 ? 's' : ''} found
          </p>
          {!profile?.resume_text && (
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: '#1a1500', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
              Upload resume to see match scores
            </Link>
          )}
        </div>

        {allMatches.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No jobs yet</p>
            <p className="text-sm" style={{ color: '#6b7a99' }}>
              Jobs refresh automatically. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {allMatches.map((m: MatchRow) => (
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
