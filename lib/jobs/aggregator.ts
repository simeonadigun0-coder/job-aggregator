import { NormalizedJob } from './types'
import { fetchRemotive } from './sources/remotive'
import { fetchWeWorkRemotely } from './sources/weworkremotely'
import { fetchTheMuse } from './sources/themuse'
import { fetchAdzuna } from './sources/adzuna'
import { fetchJSearch } from './sources/jsearch'
import { fetchNigerianJobs } from './sources/nigeria'

export async function fetchAllJobs(): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled([
    fetchRemotive(),
    fetchWeWorkRemotely(),
    fetchTheMuse(),
    fetchAdzuna(),
    fetchJSearch(),
    fetchNigerianJobs(),
  ])

  const sourceNames = ['remotive', 'wwr', 'themuse', 'adzuna', 'jsearch', 'nigeria']
  const allJobs: NormalizedJob[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`${sourceNames[i]}: ${result.value.length} jobs fetched`)
      allJobs.push(...result.value)
    } else {
      console.error(`${sourceNames[i]} failed:`, result.reason)
    }
  })

  // Freshness ("active" for 23h, archived until 5 days, then deleted) is
  // handled downstream by fetched_at — see JobsPage.tsx queries and
  // lib/jobs/cleanup.ts. We don't also filter on each job's original
  // posted_at here: most source boards rarely have posted_at within the
  // last 23 hours even for jobs that are still open, so doing both filters
  // was discarding nearly everything before it reached the DB.
  const combined = allJobs

  // Dedupe by external_id
  const seen = new Set<string>()
  return combined.filter(job => {
    if (seen.has(job.external_id)) return false
    seen.add(job.external_id)
    return true
  })
}

// Remote/hybrid only filter for international
export function filterRemoteHybrid(jobs: NormalizedJob[]): NormalizedJob[] {
  return jobs.filter(j => j.job_type === 'remote' || j.job_type === 'hybrid')
}
