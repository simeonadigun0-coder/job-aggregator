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
    .select(
      `
      id, match_score, match_reason, is_strong_match, status,
      jobs ( title, company, location, job_type, source, apply_url, posted_at )
    `
    )
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

  const strongMatches = ((matches as unknown as MatchRow[]) || []).filter((m) => m.is_strong_match)
  const otherMatches = ((matches as unknown as MatchRow[]) || []).filter((m) => !m.is_strong_match)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              {profile?.display_name || 'Your'} Job Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              {matches?.length || 0} active matches
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <ResumeUpload currentFilename={profile?.resume_filename || null} />

        {!profile?.resume_text && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4">
            Upload your resume above to start seeing job matches. New jobs are pulled
            and matched automatically every morning at 7AM.
          </div>
        )}

        {strongMatches.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Strong Matches ({strongMatches.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
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

        {otherMatches.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Other Matches ({otherMatches.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
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

        {profile?.resume_text && (matches?.length || 0) === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No matches yet. The daily job pull runs at 7AM — check back soon.
          </div>
        )}
      </main>
    </div>
  )
}
