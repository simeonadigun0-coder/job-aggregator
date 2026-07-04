import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() || ''
  const type = request.nextUrl.searchParams.get('type') || 'all'
  const country = request.nextUrl.searchParams.get('country') || 'all'

  if (!q) return NextResponse.json({ jobs: [] })

  let query = supabase
    .from('jobs')
    .select('id, title, company, location, job_type, source, apply_url, posted_at, description, country, fetched_at')
    .or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
    .order('fetched_at', { ascending: false })
    .limit(50)

  if (type !== 'all') query = query.eq('job_type', type)
  if (country === 'nigeria') query = query.eq('country', 'Nigeria')
  else if (country === 'international') query = query.neq('country', 'Nigeria')

  const { data: jobs, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ jobs: jobs || [], query: q })
}
