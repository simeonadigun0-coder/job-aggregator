'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(30 * 60) // 30 min in seconds
  const router = useRouter()

  const runRefresh = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setState('error')
      } else {
        setState('done')
        setLastRefresh(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        setCountdown(30 * 60) // reset countdown
        router.refresh()
      }
    } catch {
      setState('error')
    } finally {
      setTimeout(() => setState('idle'), 4000)
    }
  }, [router])

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      runRefresh()
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [runRefresh])

  // Countdown ticker — updates every second
  useEffect(() => {
    const ticker = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30 * 60
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(ticker)
  }, [])

  function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const label = {
    idle: '↻ Refresh',
    loading: 'Fetching...',
    done: '✓ Updated',
    error: 'Retry',
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
    <div className="flex items-center gap-2">
      {/* Countdown — only show when idle */}
      {state === 'idle' && (
        <span className="text-[10px] hidden sm:block" style={{ color: '#2a3a55' }}>
          Next: {formatCountdown(countdown)}
        </span>
      )}
      {lastRefresh && state === 'idle' && (
        <span className="text-[10px] hidden sm:block" style={{ color: '#2a3a55' }}>
          · Last: {lastRefresh}
        </span>
      )}
      <button
        onClick={runRefresh}
        disabled={state === 'loading'}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg tracking-wider uppercase transition-all flex items-center gap-1.5"
        style={{ background: bg, color, border: `1px solid ${color}44` }}
      >
        {state === 'loading' && (
          <span className="inline-block w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" />
        )}
        {label}
      </button>
    </div>
  )
}
