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

  // For Nigerian jobs: keep all (no date filter — Nigerian boards update slowly)
  // For international jobs: filter last 7 days (generous to ensure first run gets jobs)
  const nigerian = allJobs.filter(j => j.country === 'Nigeria')
  const international = allJobs.filter(j => j.country !== 'Nigeria')

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days
  const recentInternational = international.filter(job => {
    if (!job.posted_at) return true
    const t = new Date(job.posted_at).getTime()
    return !isNaN(t) && t >= cutoff
  })

  const combined = [...nigerian, ...recentInternational]

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
