import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import JobCard from '@/components/JobCard'
import SignOutButton from '@/components/SignOutButton'

export default async function SavedJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('auto_apply_enabled').eq('id', user.id).single()

  const { data: saved } = await supabase
    .from('saved_jobs')
    .select('job_id, jobs(id, title, company, location, job_type, source, apply_url, posted_at, description, country)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  type SavedRow = {
    job_id: string
    jobs: { id: string; title: string; company: string | null; location: string | null
      job_type: string; source: string; apply_url: string | null; posted_at: string | null
      description: string | null; country: string | null }
  }

  const savedJobs = (saved as unknown as SavedRow[]) || []

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs" style={{ color: '#6b7a99' }}>← Dashboard</Link>
            <span style={{ color: '#1e2d4a' }}>|</span>
            <span className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>🔖 Saved Jobs</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>Profile</Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <p className="text-xs" style={{ color: '#6b7a99' }}>
          {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''} · Saved jobs stay even after they expire from the main feed
        </p>

        {savedJobs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <p className="text-2xl mb-3">🔖</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No saved jobs yet</p>
            <p className="text-xs mb-5" style={{ color: '#6b7a99' }}>
              Bookmark jobs from any listing to save them here for later
            </p>
            <Link href="/jobs/all"
              className="text-xs font-semibold px-5 py-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {savedJobs.map((s: SavedRow) => (
              <JobCard
                key={s.job_id}
                matchId={`saved-${s.job_id}`}
                jobId={s.jobs.id}
                title={s.jobs.title}
                company={s.jobs.company}
                location={s.jobs.location}
                jobType={s.jobs.job_type}
                source={s.jobs.source}
                applyUrl={s.jobs.apply_url}
                matchScore={0}
                matchReason={null}
                isStrongMatch={false}
                status="new"
                postedAt={s.jobs.posted_at}
                description={s.jobs.description}
                autoApplyEnabled={(profile as any)?.auto_apply_enabled || false}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
