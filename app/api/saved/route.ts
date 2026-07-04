import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('saved_jobs')
    .select('job_id, created_at, jobs(id, title, company, location, job_type, source, apply_url, posted_at, description, country)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ saved: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId, action } = await request.json()
  if (!jobId) return NextResponse.json({ error: 'No jobId' }, { status: 400 })

  if (action === 'save') {
    await supabase.from('saved_jobs').upsert({ user_id: user.id, job_id: jobId }, { onConflict: 'user_id,job_id' })
    return NextResponse.json({ saved: true })
  } else {
    await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId)
    return NextResponse.json({ saved: false })
  }
}
