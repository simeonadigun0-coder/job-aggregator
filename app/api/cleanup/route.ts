import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createServiceClient()

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Remove job matches where the job was fetched more than 24 hours ago
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id')
    .lt('fetched_at', cutoff)

  if (!oldJobs || oldJobs.length === 0) {
    return NextResponse.json({ removed: 0 })
  }

  const oldJobIds = oldJobs.map((j: { id: string }) => j.id)

  // Delete matches for old jobs
  const { count: matchesRemoved } = await supabase
    .from('job_matches')
    .delete({ count: 'exact' })
    .in('job_id', oldJobIds)

  // Delete the old jobs themselves
  const { count: jobsRemoved } = await supabase
    .from('jobs')
    .delete({ count: 'exact' })
    .in('id', oldJobIds)

  return NextResponse.json({
    removed: jobsRemoved || 0,
    matchesRemoved: matchesRemoved || 0,
    cutoff,
  })
}
