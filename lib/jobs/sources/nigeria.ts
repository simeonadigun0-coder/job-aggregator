import Parser from 'rss-parser'
import { NormalizedJob, guessJobType } from '../types'

const parser = new Parser({ timeout: 10000 })

// Jobberman RSS - Nigeria's #1 job board
async function fetchJobberman(): Promise<NormalizedJob[]> {
  try {
    const feed = await parser.parseURL('https://www.jobberman.com/feeds/jobs.rss')
    return feed.items.map((item): NormalizedJob => {
      const fullText = `${item.title || ''} ${item.contentSnippet || ''}`
      return {
        external_id: `jobberman-${item.guid || item.link}`,
        source: 'jobberman',
        title: item.title || 'Untitled',
        company: extractCompany(item.title || ''),
        location: 'Nigeria',
        country: 'Nigeria',
        job_type: guessJobType(fullText),
        description: (item.contentSnippet || item.content || '').slice(0, 5000),
        apply_url: item.link || null,
        salary_text: null,
        posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        raw_data: item as Record<string, unknown>,
      }
    })
  } catch (err) {
    console.error('Jobberman fetch failed:', err)
    return []
  }
}

// MyJobMag - Nigeria job board
async function fetchMyJobMag(): Promise<NormalizedJob[]> {
  try {
    const feed = await parser.parseURL('https://www.myjobmag.com/rss/jobs')
    return feed.items.map((item): NormalizedJob => {
      const fullText = `${item.title || ''} ${item.contentSnippet || ''}`
      return {
        external_id: `myjobmag-${item.guid || item.link}`,
        source: 'myjobmag',
        title: item.title || 'Untitled',
        company: extractCompany(item.title || ''),
        location: item['location'] || 'Nigeria',
        country: 'Nigeria',
        job_type: guessJobType(fullText),
        description: (item.contentSnippet || item.content || '').slice(0, 5000),
        apply_url: item.link || null,
        salary_text: null,
        posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        raw_data: item as Record<string, unknown>,
      }
    })
  } catch (err) {
    console.error('MyJobMag fetch failed:', err)
    return []
  }
}

// NgCareers - Nigeria
async function fetchNgCareers(): Promise<NormalizedJob[]> {
  try {
    const feed = await parser.parseURL('https://ngcareers.com/feed')
    return feed.items.map((item): NormalizedJob => {
      const fullText = `${item.title || ''} ${item.contentSnippet || ''}`
      return {
        external_id: `ngcareers-${item.guid || item.link}`,
        source: 'ngcareers',
        title: item.title || 'Untitled',
        company: null,
        location: 'Nigeria',
        country: 'Nigeria',
        job_type: guessJobType(fullText),
        description: (item.contentSnippet || item.content || '').slice(0, 5000),
        apply_url: item.link || null,
        salary_text: null,
        posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        raw_data: item as Record<string, unknown>,
      }
    })
  } catch (err) {
    console.error('NgCareers fetch failed:', err)
    return []
  }
}

// JSearch queries specifically for Nigeria
async function fetchJSearchNigeria(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return []

  const queries = [
    'jobs in Lagos Nigeria',
    'jobs in Abuja Nigeria',
    'remote jobs Nigeria',
    'tech jobs Nigeria 2025',
  ]

  const allJobs: NormalizedJob[] = []

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=3days`,
        {
          headers: {
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
          },
          next: { revalidate: 0 },
        }
      )
      if (!res.ok) continue
      const data = await res.json()
      for (const job of data.data || []) {
        const fullText = `${job.job_title} ${job.job_description || ''}`
        allJobs.push({
          external_id: `jsearch-ng-${job.job_id}`,
          source: 'jsearch',
          title: job.job_title,
          company: job.employer_name || null,
          location: job.job_city ? `${job.job_city}, Nigeria` : 'Nigeria',
          country: 'Nigeria',
          job_type: job.job_is_remote ? 'remote' : guessJobType(fullText),
          description: (job.job_description || '').slice(0, 5000),
          apply_url: job.job_apply_link || null,
          salary_text: job.job_min_salary ? `${job.job_min_salary}–${job.job_max_salary} ${job.job_salary_currency || ''}` : null,
          posted_at: job.job_posted_at_datetime_utc || null,
          raw_data: job,
        })
      }
    } catch (err) {
      console.error(`JSearch Nigeria failed for "${query}":`, err)
    }
  }

  return allJobs
}

function extractCompany(title: string): string | null {
  // Many Nigerian job boards format as "Job Title at Company" or "Job Title - Company"
  const atMatch = title.match(/ at (.+)$/i)
  if (atMatch) return atMatch[1].trim()
  const dashMatch = title.match(/ [-–] (.+)$/i)
  if (dashMatch) return dashMatch[1].trim()
  return null
}

export async function fetchNigerianJobs(): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled([
    fetchJobberman(),
    fetchMyJobMag(),
    fetchNgCareers(),
    fetchJSearchNigeria(),
  ])

  const sources = ['jobberman', 'myjobmag', 'ngcareers', 'jsearch-nigeria']
  const allJobs: NormalizedJob[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`${sources[i]}: ${result.value.length} Nigerian jobs fetched`)
      allJobs.push(...result.value)
    } else {
      console.error(`${sources[i]} failed:`, result.reason)
    }
  })

  return allJobs
}
