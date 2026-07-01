import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllJobs } from '@/lib/jobs/aggregator'
import { matchJobToResume } from '@/lib/jobs/matcher'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_MATCHES_PER_RUN = 40

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const log: Record<string, unknown> = { startedAt: new Date().toISOString() }

  try {
    // 1. Fetch jobs directly — no HTTP call needed
    const jobs = await fetchAllJobs()
    log.jobsFetched = jobs.length

    if (jobs.length === 0) {
      return NextResponse.json({ ...log, message: 'No new jobs found from sources' })
    }

    // 2. Upsert jobs
    const { data: insertedJobs, error: insertError } = await serviceClient
      .from('jobs')
      .upsert(jobs, { onConflict: 'external_id', ignoreDuplicates: true })
      .select('id, title, description')

    if (insertError) {
      log.insertError = insertError.message
      return NextResponse.json(log, { status: 500 })
    }
    log.jobsInserted = insertedJobs?.length || 0

    // 3. Get profiles with resumes
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, resume_text')
      .not('resume_text', 'is', null)

    log.profilesWithResume = profiles?.length || 0

    // 4. Find unmatched jobs and run AI matching
    const { data: alreadyMatchedRows } = await serviceClient
      .from('job_matches')
      .select('job_id')
      .in('job_id', (insertedJobs || []).map((j: { id: string }) => j.id))

    const alreadyMatchedSet = new Set(
      (alreadyMatchedRows || []).map((r: { job_id: string }) => r.job_id)
    )
    const unmatchedJobs = (insertedJobs || []).filter(
      (j: { id: string }) => !alreadyMatchedSet.has(j.id)
    )

    let matchesCreated = 0
    if (profiles && unmatchedJobs.length > 0) {
      const jobsToMatch = unmatchedJobs.slice(0, MAX_MATCHES_PER_RUN)
      log.jobsQueuedForMatching = jobsToMatch.length

      for (const profile of profiles) {
        for (const job of jobsToMatch) {
          const result = await matchJobToResume(
            profile.resume_text,
            job.title,
            job.description || ''
          )
          await serviceClient.from('job_matches').upsert(
            {
              user_id: profile.id,
              job_id: job.id,
              match_score: result.score,
              match_reason: result.reason,
              is_strong_match: result.isStrongMatch,
            },
            { onConflict: 'user_id,job_id' }
          )
          matchesCreated++
        }
      }
    }

    log.matchesCreated = matchesCreated
    log.completedAt = new Date().toISOString()
    return NextResponse.json(log)

  } catch (err) {
    console.error('Refresh failed:', err)
    return NextResponse.json({ ...log, error: String(err) }, { status: 500 })
  }
}
