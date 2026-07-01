'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const router = useRouter()

  async function handleRefresh() {
    setState('loading')
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setState('error')
      } else {
        setState('done')
        router.refresh()
      }
    } catch {
      setState('error')
    } finally {
      setTimeout(() => setState('idle'), 4000)
    }
  }

  const label = {
    idle: '↻ Refresh Jobs',
    loading: 'Fetching...',
    done: '✓ Updated',
    error: 'Failed — retry',
  }[state]

  const bg = {
    idle: '#1a2235',
    loading: '#1a2235',
    done: '#0a1a0a',
    error: '#1a0a0a',
  }[state]

  const color = {
    idle: '#c9a84c',
    loading: '#8a7a4a',
    done: '#4ade80',
    error: '#f87171',
  }[state]

  return (
    <button
      onClick={handleRefresh}
      disabled={state === 'loading'}
      className="text-xs font-semibold px-4 py-2 rounded-lg tracking-wider uppercase transition-all flex items-center gap-2"
      style={{ background: bg, color, border: `1px solid ${color}44` }}
    >
      {state === 'loading' && (
        <span className="inline-block w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
      )}
      {label}
    </button>
  )
}
