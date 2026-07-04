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
  initialSaved?: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  remotive: 'Remotive', wwr: 'We Work Remotely', themuse: 'The Muse',
  adzuna: 'Adzuna', jsearch: 'LinkedIn/Indeed', jobberman: 'Jobberman',
  myjobmag: 'MyJobMag', ngcareers: 'NgCareers',
}

const COMPANY_COLORS = ['#c9a84c', '#7a9ac0', '#4ade80', '#9a7ac0', '#c07a7a', '#7ac07a']
function getCompanyColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COMPANY_COLORS[Math.abs(h) % COMPANY_COLORS.length]
}

export default function JobCard(props: JobCardProps) {
  const [status, setStatus] = useState(props.status)
  const [showModal, setShowModal] = useState(false)
  const [saved, setSaved] = useState(props.initialSaved || false)
  const [showTooltip, setShowTooltip] = useState(false)
  const supabase = createClient()

  async function updateStatus(newStatus: string) {
    setStatus(newStatus)
    if (!props.matchId.startsWith('raw-') && !props.matchId.startsWith('saved-')) {
      await supabase.from('job_matches').update({ status: newStatus }).eq('id', props.matchId)
    }
  }

  async function toggleSave() {
    const next = !saved
    setSaved(next)
    await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: props.jobId, action: next ? 'save' : 'unsave' }),
    })
  }

  const scoreColor = props.matchScore >= 75 ? '#c9a84c' : props.matchScore >= 50 ? '#7a8a6a' : '#3a4a6a'
  const scoreBg = props.matchScore >= 75 ? '#1a1200' : props.matchScore >= 50 ? '#0a1208' : '#0a0e1a'

  const now = Date.now()
  const postedTime = props.postedAt ? new Date(props.postedAt).getTime() : 0
  const ageHours = postedTime ? (now - postedTime) / 3600000 : 0
  const isNew = ageHours > 0 && ageHours < 2
  const isExpiringSoon = ageHours > 20 && ageHours < 24
  const hoursLeft = isExpiringSoon ? Math.max(0, Math.ceil(24 - ageHours)) : 0

  const companyInitial = (props.company || props.title || 'J')[0].toUpperCase()
  const companyColor = getCompanyColor(props.company || props.title || 'J')

  return (
    <>
      <div className="rounded-xl p-4 flex flex-col gap-3 transition-all"
        style={{
          background: '#111827',
          border: `1px solid ${props.isStrongMatch ? '#c9a84c44' : '#1e2d4a'}`,
          boxShadow: props.isStrongMatch ? '0 0 24px rgba(201,168,76,0.08)' : 'none',
        }}>

        {/* Expiry warning */}
        {isExpiringSoon && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: '#1a0a0a', border: '1px solid #5a2a1a' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: '#f87171' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#f87171' }}>
              Expires in {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''} — apply now
            </span>
          </div>
        )}

        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Company initial */}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: companyColor + '22', color: companyColor, border: `1px solid ${companyColor}44` }}>
            {companyInitial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {isNew && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#0a1a0a', color: '#4ade80', border: '1px solid #1a3a1a' }}>New</span>
              )}
              {props.isStrongMatch && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#c9a84c22', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  Strong Match
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{ background: '#1a2235', color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                {props.jobType}
              </span>
              <span className="text-[10px]" style={{ color: '#3a4a6a' }}>
                {SOURCE_LABELS[props.source] || props.source}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-snug mb-0.5" style={{ color: '#e8dcc8', wordBreak: 'break-word' }}>
              {props.title}
            </h3>
            <p className="text-xs" style={{ color: '#6b7a99' }}>
              {props.company || 'Unknown company'}
              {props.location ? <span style={{ color: '#3a4a6a' }}> · {props.location}</span> : null}
            </p>
          </div>

          {/* Right side: save + score */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Save button */}
            <button onClick={toggleSave}
              className="text-base leading-none transition-all"
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: saved ? 1 : 0.3 }}
              title={saved ? 'Remove from saved' : 'Save for later'}>
              🔖
            </button>

            {/* Score */}
            {props.matchScore > 0 ? (
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-col cursor-help"
                  style={{ background: scoreBg, border: `1px solid ${scoreColor}44` }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}>
                  <span className="text-sm font-bold leading-none" style={{ color: scoreColor }}>{props.matchScore}</span>
                  <span className="text-[9px]" style={{ color: scoreColor + '88' }}>%</span>
                </div>
                {/* Tooltip */}
                {showTooltip && props.matchReason && (
                  <div className="absolute right-0 top-12 z-20 w-48 rounded-xl p-3 text-xs leading-relaxed"
                    style={{ background: '#1a2235', border: '1px solid #2a3d5a', color: '#e8dcc8', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    <p className="font-semibold mb-1" style={{ color: '#c9a84c' }}>Why this score?</p>
                    {props.matchReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-center"
                style={{ background: '#1a1500', border: '1px solid #c9a84c33' }}>
                <span className="text-[9px] leading-tight" style={{ color: '#8a7a4a' }}>Upload CV</span>
              </div>
            )}
          </div>
        </div>

        {/* Match reason box */}
        {props.matchReason && (
          <div className="px-3 py-2 rounded-lg"
            style={{ background: '#0d1120', border: '1px solid #1a2235' }}>
            <p className="text-xs leading-relaxed" style={{ color: props.isStrongMatch ? '#c9a84c' : '#7a8a6a' }}>
              {props.matchReason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-1" style={{ borderTop: '1px solid #1a2235' }}>
          {props.autoApplyEnabled && status !== 'applied' && (
            <button onClick={() => setShowModal(true)}
              className="text-xs font-bold px-3 py-2 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
              Auto-Apply
            </button>
          )}

          {props.applyUrl && status !== 'applied' && (
            <a href={props.applyUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => updateStatus('applied')}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={props.isStrongMatch && !props.autoApplyEnabled
                ? { background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }
                : { color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
              Apply to {props.company || 'this role'}
            </a>
          )}

          {status === 'applied' && (
            <span className="text-xs px-3 py-2 rounded-lg"
              style={{ background: '#0a1a0a', color: '#4a8a4a', border: '1px solid #1a3a1a' }}>Applied</span>
          )}

          {status !== 'dismissed' && status !== 'applied' && (
            <button onClick={() => updateStatus('dismissed')}
              className="text-xs ml-auto"
              style={{ color: '#3a4a6a', background: 'none', border: 'none', cursor: 'pointer' }}>
              Dismiss
            </button>
          )}

          {props.postedAt && (
            <span className="text-[10px] ml-auto" style={{ color: '#2a3a55' }}>
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
