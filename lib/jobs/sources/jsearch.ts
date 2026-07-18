import { NormalizedJob, guessJobType } from '../types'

// JSearch via RapidAPI: paid, covers LinkedIn/Indeed/Glassdoor aggregated.
// https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
const SEARCH_QUERIES = [
  'remote developer jobs in Nigeria',
  'remote jobs United Kingdom',
  'remote jobs United States',
  'remote jobs Germany',
  'remote jobs Denmark',
  'hybrid jobs Nigeria',
]

export async function fetchJSearch(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    console.log('JSearch skipped: no RAPIDAPI_KEY configured')
    return []
  }

  const allJobs: NormalizedJob[] = []

  for (const query of SEARCH_QUERIES) {
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
      if (!res.ok) {
        console.error(`JSearch HTTP ${res.status} for query "${query}"`)
        continue
      }
      const data = await res.json()

      for (const job of data.data || []) {
        const fullText = `${job.job_title} ${job.job_description || ''}`
        allJobs.push({
          external_id: `jsearch-${job.job_id}`,
          source: 'jsearch',
          title: job.job_title,
          company: job.employer_name || null,
          location: job.job_city
            ? `${job.job_city}, ${job.job_country}`
            : job.job_country || null,
          country: job.job_country || null,
          job_type: job.job_is_remote ? 'remote' : guessJobType(fullText),
          description: (job.job_description || '').slice(0, 5000),
          apply_url: job.job_apply_link || null,
          salary_text:
            job.job_min_salary && job.job_max_salary
              ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency || ''}`
              : null,
          posted_at: job.job_posted_at_datetime_utc || null,
          raw_data: job,
        })
      }
    } catch (err) {
      console.error(`JSearch fetch failed for "${query}":`, err)
    }
  }

  return allJobs
}
