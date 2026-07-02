import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { matchJobToResume } from '@/lib/jobs/matcher'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  // Get this user's profile and resume
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, resume_text')
    .eq('id', user.id)
    .single()

  if (!profile?.resume_text) {
    return NextResponse.json({ message: 'No resume uploaded yet' })
  }

  // Get all jobs that don't have a match for this user yet
  const { data: existingMatches } = await serviceClient
    .from('job_matches')
    .select('job_id')
    .eq('user_id', user.id)

  const matchedJobIds = new Set((existingMatches || []).map((m: { job_id: string }) => m.job_id))

  const { data: allJobs } = await serviceClient
    .from('jobs')
    .select('id, title, description')
    .limit(100)

  const unmatchedJobs = (allJobs || []).filter((j: { id: string }) => !matchedJobIds.has(j.id))

  if (unmatchedJobs.length === 0) {
    return NextResponse.json({ message: 'All jobs already matched', count: 0 })
  }

  // Match in parallel batches of 5
  const toMatch = unmatchedJobs.slice(0, 30)
  const BATCH = 5
  let matchesCreated = 0

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

  return NextResponse.json({ success: true, matchesCreated })
}
