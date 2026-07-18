import { NormalizedJob, guessJobType } from '../types'

// Nigerian job sources — using JSearch (RapidAPI) which reliably covers Nigerian listings
// including LinkedIn Nigeria, Indeed Nigeria, and local boards

const NIGERIAN_QUERIES = [
  'jobs in Lagos Nigeria',
  'jobs in Abuja Nigeria',
  'jobs in Port Harcourt Nigeria',
  'remote jobs Nigeria',
  'tech jobs Nigeria',
  'finance jobs Nigeria',
  'marketing jobs Nigeria',
  'engineering jobs Nigeria',
]

export async function fetchNigerianJobs(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  const allJobs: NormalizedJob[] = []

  // 1. JSearch — covers LinkedIn Nigeria, Indeed Nigeria, Glassdoor Nigeria
  if (apiKey) {
    for (const query of NIGERIAN_QUERIES) {
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
            source: 'jobberman',  // label as jobberman so it shows nicely
            title: job.job_title,
            company: job.employer_name || null,
            location: job.job_city
              ? `${job.job_city}, Nigeria`
              : 'Nigeria',
            country: 'Nigeria',
            job_type: job.job_is_remote ? 'remote' : guessJobType(fullText),
            description: (job.job_description || '').slice(0, 5000),
            apply_url: job.job_apply_link || null,
            salary_text: job.job_min_salary
              ? `${job.job_min_salary}–${job.job_max_salary} ${job.job_salary_currency || ''}`
              : null,
            posted_at: job.job_posted_at_datetime_utc || null,
            raw_data: job,
          })
        }

        // Small delay between queries to avoid rate limiting
        await new Promise(r => setTimeout(r, 200))
      } catch (err) {
        console.error(`JSearch Nigeria failed for "${query}":`, err)
      }
    }
    console.log(`Nigerian jobs via JSearch: ${allJobs.length}`)
  }

  // 2. Remotive — filter for Nigeria/Africa
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=200', {
      next: { revalidate: 0 },
    })
    if (res.ok) {
      const data = await res.json()
      const nigerianRemote = (data.jobs || []).filter((job: Record<string, unknown>) => {
        const loc = ((job.candidate_required_location as string) || '').toLowerCase()
        return loc.includes('nigeria') || loc.includes('africa') || loc.includes('worldwide') || loc === ''
      })

      for (const job of nigerianRemote) {
        allJobs.push({
          external_id: `remotive-ng-${job.id}`,
          source: 'ngcareers',
          title: job.title as string,
          company: (job.company_name as string) || null,
          location: 'Remote — Nigeria eligible',
          country: 'Nigeria',
          job_type: 'remote',
          description: ((job.description as string) || '').replace(/<[^>]*>/g, ' ').slice(0, 5000),
          apply_url: (job.url as string) || null,
          salary_text: (job.salary as string) || null,
          posted_at: (job.publication_date as string) || null,
          raw_data: job as Record<string, unknown>,
        })
      }
      console.log(`Nigerian-eligible remote jobs from Remotive: ${nigerianRemote.length}`)
    }
  } catch (err) {
    console.error('Remotive Nigeria filter failed:', err)
  }

  // NOTE: Arbeitnow was removed from this source. It's a German/EU job board —
  // its `remote: true` flag just means "no fixed office", not "open to Nigeria".
  // Tagging all of its listings as country: 'Nigeria' was the cause of German
  // job content appearing on the Nigerian jobs page. Remotive above already
  // does proper location-string filtering (nigeria/africa/worldwide), so it's
  // the only remaining "remote, Nigeria-eligible" source besides JSearch.

  // Dedupe
  const seen = new Set<string>()
  return allJobs.filter(job => {
    if (seen.has(job.external_id)) return false
    seen.add(job.external_id)
    return true
  })
}
