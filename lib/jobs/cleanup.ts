import { SupabaseClient } from '@supabase/supabase-js'

export async function archiveOldJobs(supabase: SupabaseClient) {
  const now = Date.now()
  const cutoff23h = new Date(now - 23 * 60 * 60 * 1000).toISOString()
  const cutoff5d  = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Permanently delete jobs older than 5 days (and their matches)
  const { data: expiredJobs } = await supabase
    .from('jobs')
    .select('id')
    .lt('fetched_at', cutoff5d)

  if (expiredJobs && expiredJobs.length > 0) {
    const ids = expiredJobs.map((j: { id: string }) => j.id)
    await supabase.from('job_matches').delete().in('job_id', ids)
    await supabase.from('jobs').delete().in('id', ids)
    console.log(`Deleted ${ids.length} jobs older than 5 days`)
  }

  // 2. Archive jobs between 23 hours and 5 days old
  const { data: toArchive } = await supabase
    .from('jobs')
    .select('id')
    .lt('fetched_at', cutoff23h)
    .gte('fetched_at', cutoff5d)
    .eq('is_archived', false)

  if (toArchive && toArchive.length > 0) {
    const ids = toArchive.map((j: { id: string }) => j.id)
    await supabase.from('jobs').update({ is_archived: true }).in('id', ids)
    console.log(`Archived ${ids.length} jobs between 23hrs and 5 days`)
  }

  return {
    deleted: expiredJobs?.length || 0,
    archived: toArchive?.length || 0,
  }
}
