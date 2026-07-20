import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchAllJobs } from '@/lib/jobs/aggregator'
import { matchJobToResume } from '@/lib/jobs/matcher'
import { archiveOldJobs } from '@/lib/jobs/cleanup'
import { sendNewMatchesEmail } from '@/lib/email/notify'

const MAX_EMAILS_PER_RUN = 50
// Total Groq calls this run may make, across every user × job pair. Vercel
// Hobby gives us 60s; with MATCH_CONCURRENCY parallel calls at roughly 1-2s
// each, this budget is sized to comfortably finish with room to spare for
// the fetch/insert/email steps around it. This replaces the old
// "MAX_MATCHES_PER_RUN jobs × every profile" loop, which had no ceiling on
// total operations and would eventually exceed the function timeout as the
// user base grew.
const MAX_MATCH_OPERATIONS = 150
const MATCH_CONCURRENCY = 6
// How many currently-active jobs a brand-new user (0 existing matches) gets
// matched against on their first cron cycle, so they see real scores right
// away instead of waiting up to ~24h for the next fresh job batch.
const NEW_USER_BACKLOG_JOBS = 15

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let idx = 0
  async function next(): Promise<void> {
    const i = idx++
    if (i >= items.length) return
    await worker(items[i])
    return next()
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()))
}

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

    // 2. Insert jobs into DB (upsert on external_id to avoid duplicates).
    // IMPORTANT: no ignoreDuplicates here. A job still open on day 2+ of
    // being fetched needs its fetched_at refreshed on conflict — otherwise
    // it silently ages out of the 23h "active" window and gets archived
    // even though it's still a real, live listing. Stamping fetched_at here
    // (rather than relying on the column default, which only fires on the
    // very first INSERT) is what makes that refresh actually happen.
    const jobsWithTimestamp = jobs.map(j => ({ ...j, fetched_at: new Date().toISOString() }))
    const { data: insertedJobs, error: insertError } = await supabase
      .from('jobs')
      .upsert(jobsWithTimestamp, { onConflict: 'external_id' })
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

    // 4. Existing (user, job) match pairs — used to avoid re-matching work
    // we've already done. NOTE: this must be scoped per-user, not just by
    // job_id — a job having a match for one user says nothing about
    // whether any other user has been matched against it yet.
    const { data: existingPairRows } = await supabase
      .from('job_matches')
      .select('user_id, job_id')

    const matchedPairSet = new Set(
      (existingPairRows || []).map((r: { user_id: string; job_id: string }) => `${r.user_id}:${r.job_id}`)
    )
    const matchedJobIdsByUser = new Map<string, Set<string>>()
    for (const r of (existingPairRows || []) as { user_id: string; job_id: string }[]) {
      if (!matchedJobIdsByUser.has(r.user_id)) matchedJobIdsByUser.set(r.user_id, new Set())
      matchedJobIdsByUser.get(r.user_id)!.add(r.job_id)
    }

    const freshJobs = (insertedJobs || []) as { id: string; title: string; description: string | null }[]

    // Build the full list of (profile, job) match tasks, capped to the
    // operation budget above so the run can never exceed the time limit.
    type MatchTask = { profileId: string; resumeText: string; jobId: string; jobTitle: string; jobDescription: string }
    const tasks: MatchTask[] = []

    if (profiles) {
      for (const profile of profiles) {
        for (const job of freshJobs) {
          if (matchedPairSet.has(`${profile.id}:${job.id}`)) continue
          tasks.push({
            profileId: profile.id,
            resumeText: profile.resume_text,
            jobId: job.id,
            jobTitle: job.title,
            jobDescription: job.description || '',
          })
        }
      }
    }
    log.freshJobMatchTasks = tasks.length

    // Brand-new users (zero matches ever) also get a batch of currently
    // active jobs so they don't have to wait for tomorrow's fetch to see
    // any real scores.
    let backlogTasksAdded = 0
    if (profiles) {
      const brandNewProfiles = profiles.filter(p => !matchedJobIdsByUser.has(p.id) || matchedJobIdsByUser.get(p.id)!.size === 0)
      if (brandNewProfiles.length > 0) {
        const cutoff23h = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
        const { data: activeJobs } = await supabase
          .from('jobs')
          .select('id, title, description')
          .gte('fetched_at', cutoff23h)
          .order('fetched_at', { ascending: false })
          .limit(200)

        for (const profile of brandNewProfiles) {
          const alreadyQueued = new Set(tasks.filter(t => t.profileId === profile.id).map(t => t.jobId))
          let added = 0
          for (const job of activeJobs || []) {
            if (added >= NEW_USER_BACKLOG_JOBS) break
            if (alreadyQueued.has(job.id)) continue
            tasks.push({
              profileId: profile.id,
              resumeText: profile.resume_text,
              jobId: job.id,
              jobTitle: job.title,
              jobDescription: job.description || '',
            })
            added++
            backlogTasksAdded++
          }
        }
      }
    }
    log.backlogMatchTasksForNewUsers = backlogTasksAdded

    // Cap to the total operation budget. Fresh-job tasks come first (every
    // active user should see today's jobs); backlog tasks for new users
    // fill whatever budget is left.
    const cappedTasks = tasks.slice(0, MAX_MATCH_OPERATIONS)
    log.matchTasksQueued = cappedTasks.length
    log.matchTasksSkippedDueToBudget = tasks.length - cappedTasks.length

    let matchesCreated = 0
    const newMatchesByUser = new Map<string, { count: number; strong: number }>()

    await runWithConcurrency(cappedTasks, MATCH_CONCURRENCY, async task => {
      try {
        const result = await matchJobToResume(task.resumeText, task.jobTitle, task.jobDescription)

        await supabase.from('job_matches').upsert(
          {
            user_id: task.profileId,
            job_id: task.jobId,
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
          const entry = newMatchesByUser.get(task.profileId) || { count: 0, strong: 0 }
          entry.count++
          if (result.isStrongMatch) entry.strong++
          newMatchesByUser.set(task.profileId, entry)
        }
      } catch (err) {
        console.error(`Match failed for user ${task.profileId} / job ${task.jobId}:`, err)
      }
    })
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
