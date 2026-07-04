'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to JobHunt',
    body: 'Fresh remote and hybrid jobs from Nigeria and around the world, updated every 30 minutes. Built so you spend less time searching and more time applying.',
    cta: 'Show me how it works',
    skip: true,
  },
  {
    emoji: '📄',
    title: 'Upload Your CV Once',
    body: 'We read your CV and score every job against your profile automatically. The better the match, the higher it ranks. You never have to sort through irrelevant jobs again.',
    cta: 'Got it, next',
    skip: true,
  },
  {
    emoji: '★',
    title: 'See Your Best Matches First',
    body: 'Strong matches sit at the top of every job list, highlighted in gold. We explain why each job matched your profile so you apply with confidence.',
    cta: 'One more thing',
    skip: true,
  },
  {
    emoji: '✉️',
    title: 'Apply Without Leaving JobHunt',
    body: 'Set up your cover letter template once. We tailor it for each job and send your application directly from your Gmail. You review every letter before it goes out.',
    cta: 'Start exploring jobs',
    skip: false,
  },
]

export default function OnboardingModal() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only show once ever
    if (!localStorage.getItem('jh_onboarded')) {
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      complete()
    }
  }

  function complete() {
    localStorage.setItem('jh_onboarded', '1')
    setVisible(false)
  }

  function handleUploadNow() {
    complete()
    router.push('/profile')
  }

  if (!visible) return null

  const current = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,9,18,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#111827', border: '1px solid #1e2d4a', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>

        {/* Progress bar */}
        <div className="h-1" style={{ background: '#1e2d4a' }}>
          <div className="h-1 transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #c9a84c, #8a6f2e)' }} />
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-4">
          <div className="text-5xl mb-2">{current.emoji}</div>
          <div className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: '#3a4a6a' }}>
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>
            {current.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7a99' }}>
            {current.body}
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 space-y-3">
          <button onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-bold tracking-wider uppercase"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
            {current.cta}
          </button>

          {step === 1 && (
            <button onClick={handleUploadNow}
              className="w-full py-2.5 rounded-xl text-xs font-semibold"
              style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
              Upload My CV Now
            </button>
          )}

          {current.skip && (
            <button onClick={complete}
              className="w-full text-xs text-center py-1"
              style={{ color: '#3a4a6a', background: 'none', border: 'none', cursor: 'pointer' }}>
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
