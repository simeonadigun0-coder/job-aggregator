import { NormalizedJob } from './types'
import { fetchRemotive } from './sources/remotive'
import { fetchWeWorkRemotely } from './sources/weworkremotely'
import { fetchTheMuse } from './sources/themuse'
import { fetchAdzuna } from './sources/adzuna'
import { fetchJSearch } from './sources/jsearch'

export async function fetchAllJobs(): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled([
    fetchRemotive(),
    fetchWeWorkRemotely(),
    fetchTheMuse(),
    fetchAdzuna(),
    fetchJSearch(),
  ])

  const allJobs: NormalizedJob[] = []
  const sourceNames = ['remotive', 'wwr', 'themuse', 'adzuna', 'jsearch']

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`${sourceNames[i]}: ${result.value.length} jobs fetched`)
      allJobs.push(...result.value)
    } else {
      console.error(`${sourceNames[i]} failed:`, result.reason)
    }
  })

  // Filter: remote + hybrid only
  const filtered = allJobs.filter((job) => job.job_type === 'remote' || job.job_type === 'hybrid')

  // Filter: only jobs posted in the last 36 hours (covers "yesterday's jobs" with buffer)
  const cutoff = Date.now() - 36 * 60 * 60 * 1000
  const recent = filtered.filter((job) => {
    if (!job.posted_at) return true // keep if no date (some sources don't provide it)
    const postedTime = new Date(job.posted_at).getTime()
    return !isNaN(postedTime) && postedTime >= cutoff
  })

  // Dedupe by external_id
  const seen = new Set<string>()
  const deduped = recent.filter((job) => {
    if (seen.has(job.external_id)) return false
    seen.add(job.external_id)
    return true
  })

  return deduped
}
