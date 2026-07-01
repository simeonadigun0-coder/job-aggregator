'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const AutoApplyModal = dynamic(() => import('./AutoApplyModal'), { ssr: false })

interface JobCardProps {
  matchId: string
  jobId: string
  title: string
  company: string | null
  location: string | null
  jobType: string
  source: string
  applyUrl: string | null
  matchScore: number
  matchReason: string | null
  isStrongMatch: boolean
  status: string
  postedAt: string | null
  description: string | null
  autoApplyEnabled: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  remotive: 'Remotive',
  wwr: 'We Work Remotely',
  themuse: 'The Muse',
  adzuna: 'Adzuna',
  jsearch: 'LinkedIn/Indeed',
}

export default function JobCard(props: JobCardProps) {
  const [status, setStatus] = useState(props.status)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  async function updateStatus(newStatus: string) {
    setStatus(newStatus)
    await supabase.from('job_matches').update({ status: newStatus }).eq('id', props.matchId)
  }

  const scoreColor = props.matchScore >= 75 ? '#c9a84c' : props.matchScore >= 50 ? '#7a8a6a' : '#3a4a6a'
  const scoreBg = props.matchScore >= 75 ? '#1a1200' : props.matchScore >= 50 ? '#0a1208' : '#0a0e1a'

  return (
    <>
      <div
        className="rounded-xl p-4 sm:p-5 flex flex-col gap-4 transition-all"
        style={{
          background: '#111827',
          border: `1px solid ${props.isStrongMatch ? '#c9a84c44' : '#1e2d4a'}`,
          boxShadow: props.isStrongMatch ? '0 0 20px rgba(201,168,76,0.06)' : 'none',
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {props.isStrongMatch && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest"
                  style={{ background: '#c9a84c22', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  ◆ Strong Match
                </span>
              )}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                style={{ background: '#1a2235', color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                {props.jobType}
              </span>
              <span className="text-[10px]" style={{ color: '#3a4a6a' }}>
                {SOURCE_LABELS[props.source] || props.source}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-snug mb-1" style={{ color: '#e8dcc8' }}>
              {props.title}
            </h3>
            <p className="text-xs" style={{ color: '#6b7a99' }}>
              {props.company || 'Unknown company'}
              {props.location ? <span style={{ color: '#3a4a6a' }}> · {props.location}</span> : null}
            </p>
            {props.matchReason && (
              <p className="text-xs mt-2 italic leading-relaxed" style={{ color: '#8a7a5a' }}>
                &ldquo;{props.matchReason}&rdquo;
              </p>
            )}
          </div>

          {/* Score badge */}
          <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center flex-col"
            style={{ background: scoreBg, border: `1px solid ${scoreColor}44` }}>
            <span className="text-base font-bold leading-none" style={{ color: scoreColor }}>{props.matchScore}</span>
            <span className="text-[9px]" style={{ color: scoreColor + '88' }}>%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid #1a2235' }}>
          {/* Auto-Apply button */}
          {props.autoApplyEnabled && status !== 'applied' && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold px-3 py-2 rounded-lg tracking-wider uppercase transition-all"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000', letterSpacing: '0.08em' }}
            >
              ✦ Auto-Apply
            </button>
          )}

          {/* Manual apply */}
          {props.applyUrl && status !== 'applied' && (
            <a
              href={props.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => updateStatus('applied')}
              className="text-xs font-medium px-3 py-2 rounded-lg transition-all"
              style={{ color: '#7a9ac0', border: '1px solid #1e2d4a' }}
            >
              Apply manually
            </a>
          )}

          {status === 'applied' && (
            <span className="text-xs px-3 py-2 rounded-lg" style={{ background: '#0a1a0a', color: '#4a8a4a', border: '1px solid #1a3a1a' }}>
              ✓ Applied
            </span>
          )}

          {status !== 'dismissed' && status !== 'applied' && (
            <button
              onClick={() => updateStatus('dismissed')}
              className="text-xs px-3 py-2 rounded-lg transition-all"
              style={{ color: '#3a4a6a' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#6b7a99'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#3a4a6a'}
            >
              Dismiss
            </button>
          )}

          {props.postedAt && (
            <span className="ml-auto text-[10px]" style={{ color: '#2a3a55' }}>
              {new Date(props.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {showModal && (
        <AutoApplyModal
          jobId={props.jobId}
          jobTitle={props.title}
          company={props.company || 'this company'}
          applyUrl={props.applyUrl}
          jobDescription={props.description || ''}
          onClose={() => setShowModal(false)}
          onSent={() => updateStatus('applied')}
        />
      )}
    </>
  )
}
