import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResumeUpload from '@/components/ResumeUpload'
import JobCard from '@/components/JobCard'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: matches } = await supabase
    .from('job_matches')
    .select(`
      id, match_score, match_reason, is_strong_match, status,
      jobs ( title, company, location, job_type, source, apply_url, posted_at )
    `)
    .eq('user_id', user.id)
    .neq('status', 'dismissed')
    .order('match_score', { ascending: false })
    .limit(100)

  type MatchRow = {
    id: string
    match_score: number
    match_reason: string | null
    is_strong_match: boolean
    status: string
    jobs: {
      title: string
      company: string | null
      location: string | null
      job_type: string
      source: string
      apply_url: string | null
      posted_at: string | null
    }
  }

  const allMatches = (matches as unknown as MatchRow[]) || []
  const strongMatches = allMatches.filter((m) => m.is_strong_match)
  const otherMatches = allMatches.filter((m) => !m.is_strong_match)
  const totalJobs = allMatches.length
  const strongCount = strongMatches.length

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>

      {/* Header */}
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
              <span className="text-sm font-bold text-black">J</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-widest text-xs uppercase" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobMatch</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2235', color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                  {profile?.display_name || 'Dashboard'}
                </span>
              </div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Matches', value: totalJobs, accent: false },
            { label: 'Strong Matches', value: strongCount, accent: true },
            { label: 'Job Sources', value: '5', accent: false },
            { label: 'Next Refresh', value: '7AM', accent: false },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4" style={{ background: '#111827', border: `1px solid ${stat.accent ? '#c9a84c44' : '#1e2d4a'}` }}>
              <div className="text-2xl font-bold mb-1" style={{ color: stat.accent ? '#c9a84c' : '#e8dcc8' }}>
                {stat.value}
              </div>
              <div className="text-xs tracking-wide" style={{ color: '#6b7a99' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Resume upload */}
        <ResumeUpload currentFilename={profile?.resume_filename || null} />

        {/* No resume warning */}
        {!profile?.resume_text && (
          <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: '#1a1500', border: '1px solid #c9a84c44' }}>
            <span className="text-xl mt-0.5">◆</span>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#c9a84c' }}>Resume required to activate matching</p>
              <p className="text-sm" style={{ color: '#8a7a5a' }}>
                Upload your resume above. Every morning at 7AM, new remote and hybrid jobs are pulled and scored against it automatically.
              </p>
            </div>
          </div>
        )}

        {/* Strong matches */}
        {strongMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(#c9a84c, #8a6f2e)' }} />
              <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#c9a84c', letterSpacing: '0.15em' }}>
                Strong Matches
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#c9a84c22', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                {strongMatches.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {strongMatches.map((m: MatchRow) => (
                <JobCard
                  key={m.id}
                  matchId={m.id}
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
                />
              ))}
            </div>
          </section>
        )}

        {/* Other matches */}
        {otherMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-5 rounded-full" style={{ background: '#1e2d4a' }} />
              <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#6b7a99', letterSpacing: '0.15em' }}>
                Other Matches
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2235', color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                {otherMatches.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {otherMatches.map((m: MatchRow) => (
                <JobCard
                  key={m.id}
                  matchId={m.id}
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
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {profile?.resume_text && allMatches.length === 0 && (
          <div className="text-center py-20 rounded-2xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <div className="text-4xl mb-4">◈</div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No matches yet</p>
            <p className="text-sm" style={{ color: '#6b7a99' }}>
              The daily job pull runs at 7AM Lagos time.<br />
              You can also trigger it manually from your Vercel dashboard.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-6 mt-8">
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid #1e2d4a', paddingTop: '1.5rem' }}>
          <span className="text-xs tracking-widest uppercase" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>JobMatch</span>
          <span className="text-xs" style={{ color: '#2a3a55' }}>Refreshes daily · 7AM Lagos</span>
        </div>
      </footer>
    </div>
  )
}
