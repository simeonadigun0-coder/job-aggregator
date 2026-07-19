/* eslint-disable */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

type Row = {
  id: string
  jobTitle: string
  company: string
  status: 'sent' | 'draft' | 'manual_required' | 'applied_manually'
  date: string | null
  applyUrl: string | null
  hrEmail: string | null
}

const STATUS_LABEL: Record<Row['status'], { label: string; color: string; bg: string; border: string }> = {
  sent: { label: 'Sent', color: '#4ade80', bg: '#0a1a0a', border: '#1a3a1a' },
  draft: { label: 'Draft — not sent', color: '#c9a84c', bg: '#1a1500', border: '#c9a84c44' },
  manual_required: { label: 'Manual required', color: '#7a9ac0', bg: '#0a1526', border: '#1e2d4a' },
  applied_manually: { label: 'Applied (manual)', color: '#9a7ac0', bg: '#150a26', border: '#3a1e5a' },
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rows: Row[] = []

  // Auto-apply records (draft / sent / manual_required)
  try {
    const { data: applications } = await supabase
      .from('applications')
      .select('id, job_title, company, status, apply_url, hr_email, sent_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    for (const a of applications || []) {
      rows.push({
        id: `app-${a.id}`,
        jobTitle: a.job_title,
        company: a.company,
        status: a.status === 'sent' ? 'sent' : a.status === 'manual_required' ? 'manual_required' : 'draft',
        date: a.sent_at || a.created_at,
        applyUrl: a.apply_url,
        hrEmail: a.hr_email,
      })
    }
  } catch {}

  // Manually-applied jobs (Apply button clicked, no auto-apply record)
  try {
    const { data: manualMatches } = await supabase
      .from('job_matches')
      .select('id, status, jobs!inner ( id, title, company, apply_url )')
      .eq('user_id', user.id)
      .eq('status', 'applied')
      .limit(200)

    const alreadyTracked = new Set(rows.map(r => `${r.jobTitle}::${r.company}`))

    for (const m of (manualMatches as any[]) || []) {
      const key = `${m.jobs.title}::${m.jobs.company}`
      if (alreadyTracked.has(key)) continue // already has an auto-apply record
      rows.push({
        id: `match-${m.id}`,
        jobTitle: m.jobs.title,
        company: m.jobs.company || 'Unknown company',
        status: 'applied_manually',
        date: null,
        applyUrl: m.jobs.apply_url,
        hrEmail: null,
      })
    }
  } catch {}

  // Newest first (nulls last)
  rows.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const sentCount = rows.filter(r => r.status === 'sent').length
  const manualCount = rows.filter(r => r.status === 'applied_manually').length
  const draftCount = rows.filter(r => r.status === 'draft' || r.status === 'manual_required').length

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs" style={{ color: '#6b7a99' }}>← Dashboard</Link>
            <span style={{ color: '#1e2d4a' }}>|</span>
            <span className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>📋 Applications</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>Profile</Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>{sentCount}</div>
            <div className="text-xs" style={{ color: '#6b7a99' }}>Sent</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="text-2xl font-bold" style={{ color: '#9a7ac0' }}>{manualCount}</div>
            <div className="text-xs" style={{ color: '#6b7a99' }}>Applied manually</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="text-2xl font-bold" style={{ color: '#c9a84c' }}>{draftCount}</div>
            <div className="text-xs" style={{ color: '#6b7a99' }}>Drafts / unfinished</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <p className="text-2xl mb-3">📋</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No applications yet</p>
            <p className="text-sm" style={{ color: '#6b7a99' }}>
              Jobs you apply to — auto-apply or manual — will show up here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            {rows.map((r, i) => {
              const s = STATUS_LABEL[r.status]
              return (
                <div key={r.id}
                  className="flex items-center justify-between gap-4 p-4 flex-wrap"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid #1a2235' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>{r.jobTitle}</p>
                    <p className="text-xs" style={{ color: '#6b7a99' }}>
                      {r.company}
                      {r.hrEmail ? <span style={{ color: '#3a4a6a' }}> · sent to {r.hrEmail}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.date && (
                      <span className="text-[11px]" style={{ color: '#3a4a6a' }}>
                        {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      {s.label}
                    </span>
                    {r.applyUrl && (
                      <a href={r.applyUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs" style={{ color: '#7a9ac0' }}>View →</a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
