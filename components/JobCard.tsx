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
  jobberman: 'Jobberman',
  myjobmag: 'MyJobMag',
  ngcareers: 'NgCareers',
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
        className="rounded-xl p-4 flex flex-col gap-3 transition-all w-full"
        style={{
          background: '#111827',
          border: `1px solid ${props.isStrongMatch ? '#c9a84c44' : '#1e2d4a'}`,
          boxShadow: props.isStrongMatch ? '0 0 20px rgba(201,168,76,0.06)' : 'none',
          boxSizing: 'border-box',
        }}
      >
        {/* Top row / title + score */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {props.isStrongMatch && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                  style={{ background: '#c9a84c22', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  Strong
                </span>
              )}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0"
                style={{ background: '#1a2235', color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                {props.jobType}
              </span>
              <span className="text-[10px] shrink-0" style={{ color: '#3a4a6a' }}>
                {SOURCE_LABELS[props.source] || props.source}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold leading-snug mb-1" style={{ color: '#e8dcc8', wordBreak: 'break-word' }}>
              {props.title}
            </h3>

            {/* Company / Location */}
            <p className="text-xs leading-relaxed" style={{ color: '#6b7a99', wordBreak: 'break-word' }}>
              {props.company || 'Unknown company'}
              {props.location ? <span style={{ color: '#3a4a6a' }}> · {props.location}</span> : null}
            </p>
          </div>

          {/* Score badge */}
          <div className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center flex-col"
            style={{ background: scoreBg, border: `1px solid ${scoreColor}44` }}>
            <span className="text-sm font-bold leading-none" style={{ color: scoreColor }}>{props.matchScore}</span>
            <span className="text-[9px]" style={{ color: scoreColor + '88' }}>%</span>
          </div>
        </div>

        {/* Match reason */}
        {props.matchReason && (
          <p className="text-xs italic leading-relaxed px-3 py-2 rounded-lg"
            style={{ color: '#8a7a5a', background: '#0d1120', border: '1px solid #1a2235' }}>
            &ldquo;{props.matchReason}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-1" style={{ borderTop: '1px solid #1a2235' }}>
          {props.autoApplyEnabled && status !== 'applied' && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold px-3 py-2 rounded-lg tracking-wide uppercase flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}
            >
              Auto-Apply
            </button>
          )}

          {props.applyUrl && status !== 'applied' && (
            <a
              href={props.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => updateStatus('applied')}
              className="text-xs font-medium px-3 py-2 rounded-lg flex-shrink-0"
              style={{ color: '#7a9ac0', border: '1px solid #1e2d4a' }}
            >
              Apply →
            </a>
          )}

          {status === 'applied' && (
            <span className="text-xs px-3 py-2 rounded-lg flex-shrink-0"
              style={{ background: '#0a1a0a', color: '#4a8a4a', border: '1px solid #1a3a1a' }}>
              ✓ Applied
            </span>
          )}

          {status !== 'dismissed' && status !== 'applied' && (
            <button
              onClick={() => updateStatus('dismissed')}
              className="text-xs px-3 py-2 rounded-lg flex-shrink-0"
              style={{ color: '#3a4a6a' }}
            >
              Dismiss
            </button>
          )}

          {props.postedAt && (
            <span className="ml-auto text-[10px] shrink-0" style={{ color: '#2a3a55' }}>
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
