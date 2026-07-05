/* eslint-disable */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ChecklistItem {
  id: string
  label: string
  done: boolean
  action: string
  actionLabel: string
  points: number
}

export default function SetupChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  const load = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, resume_text, cover_letter_template, gmail_address, auto_apply_enabled, linkedin_url')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const checklist: ChecklistItem[] = [
      {
        id: 'account', label: 'Create your account', done: true,
        action: '', actionLabel: '', points: 20,
      },
      {
        id: 'name', label: 'Add your full name',
        done: !!(profile.display_name && profile.display_name.includes(' ')),
        action: '/profile', actionLabel: 'Add name', points: 10,
      },
      {
        id: 'resume', label: 'Upload your CV to unlock job matching',
        done: !!profile.resume_text,
        action: '/profile', actionLabel: 'Upload CV', points: 30,
      },
      {
        id: 'linkedin', label: 'Add your LinkedIn profile',
        done: !!profile.linkedin_url,
        action: '/profile', actionLabel: 'Add LinkedIn', points: 15,
      },
      {
        id: 'letter', label: 'Write your cover letter template',
        done: !!profile.cover_letter_template,
        action: '/profile?tab=letter', actionLabel: 'Write template', points: 15,
      },
      {
        id: 'autoapply', label: 'Enable Auto-Apply',
        done: !!profile.auto_apply_enabled,
        action: '/profile?tab=email', actionLabel: 'Set up', points: 10,
      },
    ]

    setItems(checklist)

    const allDone = checklist.every(i => i.done)
    // Hide checklist if dismissed or all done
    if (localStorage.getItem('jh_checklist_dismissed') || allDone) {
      setVisible(false)
    } else {
      setVisible(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (!visible) return null

  const done = items.filter(i => i.done).length
  const total = items.length
  const percent = Math.round((done / total) * 100)
  const nextItem = items.find(i => !i.done)

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
        style={{ borderBottom: collapsed ? 'none' : '1px solid #1e2d4a' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
            {percent}%
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>
              Getting started ({done}/{total} complete)
            </p>
            {!collapsed && nextItem && (
              <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
                Next: {nextItem.label}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={e => {
            e.stopPropagation()
            localStorage.setItem('jh_checklist_dismissed', '1')
            setVisible(false)
          }} className="text-xs" style={{ color: '#3a4a6a' }}>
            Dismiss
          </button>
          <span className="text-xs" style={{ color: '#3a4a6a' }}>
            {collapsed ? '▼' : '▲'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!collapsed && (
        <div className="px-5 py-1">
          <div className="h-1.5 rounded-full" style={{ background: '#1e2d4a' }}>
            <div className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #c9a84c, #8a6f2e)' }} />
          </div>
        </div>
      )}

      {/* Items */}
      {!collapsed && (
        <div className="px-5 py-4 space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: item.done ? '#0a1a0a' : '#1a2235',
                    border: `1px solid ${item.done ? '#1a3a1a' : '#1e2d4a'}`,
                  }}>
                  {item.done ? (
                    <span className="text-[10px]" style={{ color: '#4ade80' }}>✓</span>
                  ) : (
                    <span className="text-[10px]" style={{ color: '#3a4a6a' }}>○</span>
                  )}
                </div>
                <span className="text-xs" style={{
                  color: item.done ? '#3a4a6a' : '#e8dcc8',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </div>
              {!item.done && item.action && (
                <button onClick={() => router.push(item.action)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  {item.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
