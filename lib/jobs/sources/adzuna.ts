import { NormalizedJob, guessJobType } from '../types'

// Adzuna: free tier with API key. https://developer.adzuna.com/
// Covers: gb, us, de (Germany), and more. No Denmark or Nigeria coverage as of writing.
const ADZUNA_COUNTRY_CODES: Record<string, string> = {
  'United Kingdom': 'gb',
  'United States': 'us',
  'Germany': 'de',
  'Canada': 'ca',
  'Australia': 'au',
}

export async function fetchAdzuna(): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    console.log('Adzuna skipped: no API key configured')
    return []
  }

  const allJobs: NormalizedJob[] = []

  for (const [countryName, code] of Object.entries(ADZUNA_COUNTRY_CODES)) {
    try {
      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${code}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=remote%20OR%20hybrid&content-type=application/json`,
        { next: { revalidate: 0 } }
      )
      if (!res.ok) continue
      const data = await res.json()

      for (const job of data.results || []) {
        const fullText = `${job.title} ${job.description || ''}`
        allJobs.push({
          external_id: `adzuna-${job.id}`,
          source: 'adzuna',
          title: job.title,
          company: job.company?.display_name || null,
          location: job.location?.display_name || countryName,
          country: countryName,
          job_type: guessJobType(fullText),
          description: (job.description || '').slice(0, 5000),
          apply_url: job.redirect_url || null,
          salary_text: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : null,
          posted_at: job.created || null,
          raw_data: job,
        })
      }
    } catch (err) {
      console.error(`Adzuna fetch failed for ${countryName}:`, err)
    }
  }

  return allJobs
}
