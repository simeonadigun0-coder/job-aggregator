import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllJobs } from '@/lib/jobs/aggregator'
import { matchJobToResume } from '@/lib/jobs/matcher'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const startTime = Date.now()

  try {
    // Step 1: Clean up expired jobs (fast — DB operation only)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: oldJobs } = await serviceClient
      .from('jobs').select('id').lt('fetched_at', cutoff)

    if (oldJobs && oldJobs.length > 0) {
      const oldIds = oldJobs.map((j: { id: string }) => j.id)
      await serviceClient.from('job_matches').delete().in('job_id', oldIds)
      await serviceClient.from('jobs').delete().in('id', oldIds)
    }

    // Step 2: Fetch all job sources in parallel (much faster than sequential)
    const jobs = await fetchAllJobs()

    if (jobs.length === 0) {
      return NextResponse.json({ jobsFetched: 0, message: 'No new jobs found' })
    }

    // Step 3: Insert jobs (upsert — fast bulk operation)
    const { data: insertedJobs } = await serviceClient
      .from('jobs')
      .upsert(jobs, { onConflict: 'external_id', ignoreDuplicates: true })
      .select('id, title, description')

    const jobsInserted = insertedJobs?.length || 0

    // Step 4: Quick match — only for THIS user, only top 20 newest jobs
    // Full matching happens in background via cron
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id, resume_text')
      .eq('id', user.id)
      .single()

    let matchesCreated = 0

    if (profile?.resume_text && insertedJobs && insertedJobs.length > 0) {
      // Find which jobs don't have matches yet for this user
      const { data: existing } = await serviceClient
        .from('job_matches')
        .select('job_id')
        .eq('user_id', user.id)
        .in('job_id', insertedJobs.map((j: { id: string }) => j.id))

      const existingSet = new Set((existing || []).map((r: { job_id: string }) => r.job_id))
      const toMatch = insertedJobs
        .filter((j: { id: string }) => !existingSet.has(j.id))
        .slice(0, 20) // Cap at 20 for speed

      // Run matches in parallel batches of 5
      const BATCH = 5
      for (let i = 0; i < toMatch.length; i += BATCH) {
        const batch = toMatch.slice(i, i + BATCH)
        await Promise.all(
          batch.map(async (job: { id: string; title: string; description: string | null }) => {
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
          })
        )
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      jobsFetched: jobs.length,
      jobsInserted,
      matchesCreated,
      duration: `${duration}s`,
    })

  } catch (err) {
    console.error('Refresh failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
