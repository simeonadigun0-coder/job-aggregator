'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Step {
  label: string
  done: boolean
  points: number
  action: string
}

export default function ProfileCompletionBar() {
  const [steps, setSteps] = useState<Step[]>([])
  const [score, setScore] = useState(0)
  const router = useRouter()

  const load = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('display_name, resume_text, cover_letter_template, gmail_address, auto_apply_enabled, linkedin_url, phone')
      .eq('id', user.id)
      .single()

    if (!p) return

    const s: Step[] = [
      { label: 'Account created', done: true, points: 20, action: '' },
      { label: 'Full name added', done: !!(p.display_name && p.display_name.trim().includes(' ')), points: 10, action: '/profile' },
      { label: 'CV uploaded', done: !!p.resume_text, points: 30, action: '/profile' },
      { label: 'LinkedIn added', done: !!p.linkedin_url, points: 15, action: '/profile' },
      { label: 'Cover letter written', done: !!p.cover_letter_template, points: 15, action: '/profile' },
      { label: 'Auto-apply enabled', done: !!p.auto_apply_enabled, points: 10, action: '/profile' },
    ]

    setSteps(s)
    setScore(s.filter(i => i.done).reduce((sum, i) => sum + i.points, 0))
  }, [])

  useEffect(() => { load() }, [load])

  if (score === 100) return null

  const nextStep = steps.find(s => !s.done)
  const color = score < 40 ? '#f87171' : score < 70 ? '#c9a84c' : '#4ade80'

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: '#e8dcc8' }}>
            Profile strength
          </p>
          <span className="text-xs font-bold" style={{ color }}>{score}%</span>
        </div>

        {/* Bar */}
        <div className="h-1.5 rounded-full mb-3" style={{ background: '#1e2d4a' }}>
          <div className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 flex-wrap">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px]" style={{ color: s.done ? '#4ade80' : '#3a4a6a' }}>
                {s.done ? '✓' : '○'}
              </span>
              <span className="text-[10px]" style={{ color: s.done ? '#3a4a6a' : '#6b7a99',
                textDecoration: s.done ? 'line-through' : 'none' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Next action */}
        {nextStep && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: '#6b7a99' }}>
              Next: <span style={{ color: '#c9a84c' }}>{nextStep.label}</span>
            </p>
            <button onClick={() => router.push(nextStep.action)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
              Complete now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
