import { NormalizedJob, guessJobType } from '../types'

// The Muse: free public API. https://www.themuse.com/developers/api/v2
export async function fetchTheMuse(): Promise<NormalizedJob[]> {
  try {
    const allJobs: NormalizedJob[] = []

    // Page through a couple pages to get decent volume
    for (let page = 0; page < 2; page++) {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&category=Software%20Engineering&category=Data%20Science&category=Engineering`,
        { next: { revalidate: 0 } }
      )
      if (!res.ok) break
      const data = await res.json()

      for (const job of data.results || []) {
        const locationNames = (job.locations || []).map((l: { name: string }) => l.name).join(', ')
        const fullText = `${job.name} ${job.contents || ''} ${locationNames}`

        allJobs.push({
          external_id: `themuse-${job.id}`,
          source: 'themuse',
          title: job.name,
          company: job.company?.name || null,
          location: locationNames || null,
          country: locationNames || null,
          job_type: guessJobType(fullText),
          description: stripHtml(job.contents),
          apply_url: job.refs?.landing_page || null,
          salary_text: null,
          posted_at: job.publication_date || null,
          raw_data: job,
        })
      }
    }

    return allJobs
  } catch (err) {
    console.error('The Muse fetch failed:', err)
    return []
  }
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
}
