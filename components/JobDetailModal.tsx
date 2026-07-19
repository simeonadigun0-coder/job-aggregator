'use client'

interface JobDetailModalProps {
  title: string
  company: string | null
  location: string | null
  jobType: string
  source: string
  sourceLabel: string
  applyUrl: string | null
  matchScore: number
  matchReason: string | null
  isStrongMatch: boolean
  postedAt: string | null
  description: string | null
  salaryText?: string | null
  onClose: () => void
  onApply: () => void
  onAutoApply?: () => void
  showAutoApply: boolean
}

export default function JobDetailModal({
  title, company, location, jobType, sourceLabel, applyUrl,
  matchScore, matchReason, isStrongMatch, postedAt, description, salaryText,
  onClose, onApply, onAutoApply, showAutoApply,
}: JobDetailModalProps) {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
    background: 'rgba(6,9,18,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  }

  const cardStyle: React.CSSProperties = {
    background: '#111827',
    border: '1px solid #1e2d4a',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()} className="modal-overlay">
      <div style={cardStyle} className="modal-content">

        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {isStrongMatch && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#c9a84c22', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  Strong Match
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{ background: '#1a2235', color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                {jobType}
              </span>
              <span className="text-[10px]" style={{ color: '#3a4a6a' }}>{sourceLabel}</span>
            </div>
            <p className="text-base font-semibold leading-snug" style={{ color: '#e8dcc8' }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
              {company || 'Unknown company'}
              {location ? <span style={{ color: '#3a4a6a' }}> · {location}</span> : null}
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none shrink-0" style={{ color: '#3a4a6a' }}>✕</button>
        </div>

        <div className="p-5 space-y-4">
          {salaryText && (
            <div className="px-3 py-2 rounded-lg inline-block" style={{ background: '#0a1a0a', border: '1px solid #1a3a1a' }}>
              <span className="text-sm font-semibold" style={{ color: '#7ac07a' }}>💰 {salaryText}</span>
            </div>
          )}

          {matchScore > 0 && matchReason && (
            <div className="px-4 py-3 rounded-xl" style={{ background: '#0d1120', border: '1px solid #1a2235' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: isStrongMatch ? '#c9a84c' : '#7a8a6a' }}>
                {matchScore}% match
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#8a9ab0' }}>{matchReason}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>
              Job Description
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#c8d0e0' }}>
              {description || 'No description provided by the source.'}
            </p>
          </div>

          {postedAt && (
            <p className="text-xs" style={{ color: '#3a4a6a' }}>
              Posted {new Date(postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: '1px solid #1a2235' }}>
            {showAutoApply && onAutoApply && (
              <button onClick={onAutoApply}
                className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000', minWidth: '160px' }}>
                Auto-Apply
              </button>
            )}
            {applyUrl && (
              <a href={applyUrl} target="_blank" rel="noopener noreferrer" onClick={onApply}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
                style={!showAutoApply
                  ? { background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000', minWidth: '160px' }
                  : { color: '#7a9ac0', border: '1px solid #1e2d4a', minWidth: '160px' }}>
                Apply to {company || 'this role'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
