import { SupabaseClient } from '@supabase/supabase-js'

export async function archiveOldJobs(supabase: SupabaseClient) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Archive jobs older than 24hrs instead of deleting
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id')
    .lt('fetched_at', cutoff)
    .eq('is_archived', false)

  if (!oldJobs || oldJobs.length === 0) return 0

  const oldIds = oldJobs.map((j: { id: string }) => j.id)

  await supabase
    .from('jobs')
    .update({ is_archived: true })
    .in('id', oldIds)

  return oldIds.length
}
