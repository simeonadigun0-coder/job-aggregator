'use client'

import { useState } from 'react'

interface AutoApplyModalProps {
  jobTitle: string
  company: string
  applyUrl: string | null
  jobId: string
  jobDescription: string
  onClose: () => void
  onSent: () => void
}

type Step = 'consent' | 'generating' | 'review' | 'sending' | 'done' | 'manual'

export default function AutoApplyModal({
  jobTitle, company, applyUrl, jobId, jobDescription, onClose, onSent
}: AutoApplyModalProps) {
  const [step, setStep] = useState<Step>('consent')
  const [hrEmail, setHrEmail] = useState('')
  const [letter, setLetter] = useState('')
  const [subject, setSubject] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleConsent() {
    setStep('generating')
    setError(null)

    try {
      const res = await fetch('/api/apply/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, jobTitle, company, jobDescription, applyUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setStep('consent'); return }

      setLetter(data.letter)
      setSubject(data.subject)
      setApplicationId(data.applicationId)
      setStep('review')
    } catch {
      setError('Something went wrong. Please try again.')
      setStep('consent')
    }
  }

  async function handleSend() {
    if (!hrEmail || !hrEmail.includes('@')) {
      setError('Please enter a valid HR email address.')
      return
    }
    setStep('sending')
    setError(null)

    try {
      const res = await fetch('/api/apply/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, hrEmail, editedLetter: letter, subject }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setStep('review'); return }
      setStep('done')
      setTimeout(() => { onSent(); onClose() }, 2000)
    } catch {
      setError('Send failed. Please try again.')
      setStep('review')
    }
  }

  function handleManual() {
    setStep('manual')
  }

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
    maxWidth: '580px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
  }

  const inputStyle: React.CSSProperties = {
    background: '#0a0e1a', border: '1px solid #1e2d4a',
    color: '#e8dcc8', borderRadius: '8px',
    padding: '10px 14px', fontSize: '14px', width: '100%', outline: 'none',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={cardStyle}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div>
            <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: '#c9a84c' }}>Auto-Apply</p>
            <p className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>{jobTitle}</p>
            <p className="text-xs" style={{ color: '#6b7a99' }}>{company}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: '#3a4a6a' }}>✕</button>
        </div>

        <div className="p-5 space-y-5">

          {/* STEP: Consent */}
          {step === 'consent' && (
            <>
              <div className="p-4 rounded-xl" style={{ background: '#0a1526', border: '1px solid #1e2d4a' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#c9a84c' }}>Your consent is required</p>
                <p className="text-sm leading-relaxed" style={{ color: '#e8dcc8' }}>
                  I authorise JobHunt to generate a tailored cover letter and send a job application on my behalf to <strong>{company}</strong> for the role of <strong>{jobTitle}</strong>.
                </p>
                <p className="text-xs mt-3" style={{ color: '#6b7a99' }}>
                  You will review and optionally edit the letter before anything is sent. Your own words are preserved — only the company name, role, and one personalised paragraph will be adjusted.
                </p>
              </div>

              {error && <p className="text-sm px-4 py-3 rounded-lg" style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #5a1a1a' }}>{error}</p>}

              <div className="flex gap-3">
                <button onClick={handleConsent}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
                  Yes, Generate My Letter
                </button>
                <button onClick={onClose}
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* STEP: Generating */}
          {step === 'generating' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-10 h-10 mx-auto rounded-full border-2 animate-spin" style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: '#e8dcc8' }}>Tailoring your letter for {company}...</p>
              <p className="text-xs" style={{ color: '#6b7a99' }}>Preserving your voice, adjusting for this role.</p>
            </div>
          )}

          {/* STEP: Review */}
          {step === 'review' && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>Email Subject</label>
                <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#c9a84c' }}>Your Letter</label>
                  <span className="text-xs" style={{ color: '#3a4a6a' }}>Edit freely below</span>
                </div>
                <textarea
                  value={letter}
                  onChange={e => setLetter(e.target.value)}
                  rows={14}
                  className="w-full rounded-xl p-4 text-sm leading-relaxed resize-none outline-none"
                  style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8', fontFamily: 'Georgia, serif', lineHeight: '1.8' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>HR / Careers Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={hrEmail}
                  onChange={e => setHrEmail(e.target.value)}
                  placeholder="careers@company.com or hr@company.com"
                />
                <p className="text-xs mt-1.5" style={{ color: '#3a4a6a' }}>Find this on the company&apos;s careers page or LinkedIn. If unavailable, use &quot;Apply via link&quot; below.</p>
              </div>

              {error && <p className="text-sm px-4 py-3 rounded-lg" style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #5a1a1a' }}>{error}</p>}

              <div className="flex gap-3 flex-wrap">
                <button onClick={handleSend}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000', minWidth: '160px' }}>
                  Send Application
                </button>
                {applyUrl && (
                  <button onClick={handleManual}
                    className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                    Apply via link instead
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP: Sending */}
          {step === 'sending' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-10 h-10 mx-auto rounded-full border-2 animate-spin" style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: '#e8dcc8' }}>Sending your application to {company}...</p>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="py-12 text-center space-y-4">
              <div className="text-4xl">✓</div>
              <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Application sent successfully</p>
              <p className="text-xs" style={{ color: '#6b7a99' }}>Check your Inbox for a confirmation.</p>
            </div>
          )}

          {/* STEP: Manual required */}
          {step === 'manual' && (
            <>
              <div className="p-4 rounded-xl" style={{ background: '#0a1526', border: '1px solid #1e2d4a' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#7a9ac0' }}>Apply via the job portal</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#e8dcc8' }}>
                  This job requires applying through the company portal. Your tailored letter is ready below — copy it and paste it into their form.
                </p>
                <a href={applyUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold px-4 py-2.5 rounded-lg tracking-wider uppercase"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
                  Open Application Portal →
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: '#c9a84c' }}>Your Tailored Letter — copy this</label>
                <textarea
                  value={letter}
                  readOnly
                  rows={12}
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                  className="w-full rounded-xl p-4 text-sm leading-relaxed resize-none outline-none cursor-text"
                  style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8', fontFamily: 'Georgia, serif', lineHeight: '1.8' }}
                />
                <p className="text-xs mt-1" style={{ color: '#3a4a6a' }}>Click the text above to select all, then copy.</p>
              </div>

              <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm" style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                Done
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
