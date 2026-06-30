export interface NormalizedJob {
  external_id: string
  source: string
  title: string
  company: string | null
  location: string | null
  country: string | null
  job_type: 'remote' | 'hybrid' | 'onsite'
  description: string | null
  apply_url: string | null
  salary_text: string | null
  posted_at: string | null // ISO date
  raw_data: Record<string, unknown>
}

// Countries we care about, used to tag/filter jobs
export const TARGET_COUNTRIES = [
  'Nigeria', 'United Kingdom', 'United States', 'Denmark', 'Germany',
  'Canada', 'Ireland', 'Australia', 'South Africa', 'Kenya', 'Ghana',
  'Netherlands', 'Sweden', 'Remote',
]

export function guessJobType(text: string): 'remote' | 'hybrid' | 'onsite' {
  const t = text.toLowerCase()
  if (t.includes('hybrid')) return 'hybrid'
  if (t.includes('remote') || t.includes('work from home') || t.includes('anywhere')) return 'remote'
  return 'onsite'
}
