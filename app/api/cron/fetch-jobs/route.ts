import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchAllJobs } from '@/lib/jobs/aggregator'
import { matchJobToResume } from '@/lib/jobs/matcher'
import { archiveOldJobs } from '@/lib/jobs/cleanup'
import { sendNewMatchesEmail } from '@/lib/email/notify'

const MAX_MATCHES_PER_RUN = 40
const MAX_EMAILS_PER_RUN = 50

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const log: Record<string, unknown> = { startedAt: new Date().toISOString() }

  try {
    // 0. Archive jobs 23hrs+, delete jobs 5days+
    const cleanupResult = await archiveOldJobs(supabase)
    log.cleanup = cleanupResult

    // 1. Fetch jobs from all sources
    const jobs = await fetchAllJobs()
    log.jobsFetched = jobs.length

    if (jobs.length === 0) {
      return NextResponse.json({ ...log, message: 'No new jobs found' })
    }

    // 2. Insert jobs into DB (upsert on external_id to avoid duplicates)
    const { data: insertedJobs, error: insertError } = await supabase
      .from('jobs')
      .upsert(jobs, { onConflict: 'external_id', ignoreDuplicates: true })
      .select('id, external_id, title, description')

    if (insertError) {
      log.insertError = insertError.message
      return NextResponse.json(log, { status: 500 })
    }
    log.jobsInserted = insertedJobs?.length || 0

    // 3. Fetch all profiles that have a resume uploaded
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, resume_text, display_name')
      .not('resume_text', 'is', null)

    if (profilesError) {
      log.profilesError = profilesError.message
      return NextResponse.json(log, { status: 500 })
    }
    log.profilesWithResume = profiles?.length || 0

    // 4. Find jobs that don't have matches yet for any profile (avoids re-matching old jobs)
    const { data: alreadyMatchedRows } = await supabase
      .from('job_matches')
      .select('job_id')
      .in('job_id', (insertedJobs || []).map((j: { id: string }) => j.id))

    const alreadyMatchedSet = new Set(
      (alreadyMatchedRows || []).map((r: { job_id: string }) => r.job_id)
    )
    const unmatchedJobs = (insertedJobs || []).filter(
      (j: { id: string }) => !alreadyMatchedSet.has(j.id)
    )

    // Cap total matches per run so we stay under Vercel Hobby's 60s function limit.
    let matchesCreated = 0
    const newMatchesByUser = new Map<string, { count: number; strong: number }>()

    if (profiles && unmatchedJobs) {
      const jobsToMatch = unmatchedJobs.slice(0, MAX_MATCHES_PER_RUN)
      log.jobsQueuedForMatching = jobsToMatch.length
      log.jobsSkippedDueToLimit = unmatchedJobs.length - jobsToMatch.length

      for (const profile of profiles) {
        for (const job of jobsToMatch) {
          const result = await matchJobToResume(
            profile.resume_text,
            job.title,
            job.description || ''
          )

          await supabase.from('job_matches').upsert(
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

          // Only count genuine matches (score > 0) toward the notification —
          // a pile of "0% no match" jobs isn't worth emailing someone about.
          if (result.score > 0) {
            const entry = newMatchesByUser.get(profile.id) || { count: 0, strong: 0 }
            entry.count++
            if (result.isStrongMatch) entry.strong++
            newMatchesByUser.set(profile.id, entry)
          }
        }
      }
    }
    log.matchesCreated = matchesCreated

    // 5. Daily "new matches" email — one per user who got at least one
    // genuine (score > 0) match this run, capped to stay within the
    // function timeout.
    let emailsSent = 0, emailsFailed = 0
    const usersToEmail = Array.from(newMatchesByUser.entries()).slice(0, MAX_EMAILS_PER_RUN)
    log.usersEligibleForEmail = newMatchesByUser.size
    log.usersSkippedDueToEmailLimit = Math.max(0, newMatchesByUser.size - usersToEmail.length)

    if (usersToEmail.length > 0 && process.env.RESEND_API_KEY) {
      const profileById = new Map((profiles || []).map(p => [p.id, p]))
      for (const [userId, stats] of usersToEmail) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId)
          const email = authUser?.user?.email
          if (!email) continue
          const firstName = (profileById.get(userId)?.display_name || '').split(' ')[0] || ''
          const result = await sendNewMatchesEmail(email, firstName, stats.count, stats.strong)
          if (result.success) emailsSent++
          else emailsFailed++
        } catch (err) {
          emailsFailed++
          console.error(`Notification email failed for user ${userId}:`, err)
        }
      }
    }
    log.emailsSent = emailsSent
    log.emailsFailed = emailsFailed
    if (!process.env.RESEND_API_KEY) log.emailsSkippedReason = 'RESEND_API_KEY not configured'

    log.completedAt = new Date().toISOString()

    return NextResponse.json(log)
  } catch (err) {
    console.error('Cron job failed:', err)
    return NextResponse.json({ ...log, error: String(err) }, { status: 500 })
  }
}
