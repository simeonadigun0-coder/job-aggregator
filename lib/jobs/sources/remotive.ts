import { NormalizedJob } from '../types'

// Remotive: free, no API key needed. https://remotive.com/api/remote-jobs
export async function fetchRemotive(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=100', {
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`)
    const data = await res.json()

    return (data.jobs || []).map((job: Record<string, unknown>): NormalizedJob => ({
      external_id: `remotive-${job.id}`,
      source: 'remotive',
      title: job.title as string,
      company: (job.company_name as string) || null,
      location: (job.candidate_required_location as string) || 'Remote',
      country: (job.candidate_required_location as string) || 'Remote',
      job_type: 'remote',
      description: stripHtml(job.description as string),
      apply_url: (job.url as string) || null,
      salary_text: (job.salary as string) || null,
      posted_at: (job.publication_date as string) || null,
      raw_data: job,
    }))
  } catch (err) {
    console.error('Remotive fetch failed:', err)
    return []
  }
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
}
