/* eslint-disable */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const MESSAGES = [
  'Fetching jobs...',
  'Scanning sources...',
  'Pulling Nigerian jobs...',
  'Checking remote roles...',
  'Matching to your profile...',
  'Almost done...',
]

export default function RefreshButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msgIndex, setMsgIndex] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [jobCount, setJobCount] = useState<number | null>(null)
  const router = useRouter()

  const runRefresh = useCallback(async () => {
    if (state === 'loading') return
    setState('loading')
    setMsgIndex(0)

    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2500)

    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      clearInterval(interval)
      if (data.error) {
        setState('error')
      } else {
        setState('done')
        setJobCount(data.jobsFetched || 0)
        setLastRefresh(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        router.refresh()
      }
    } catch {
      clearInterval(interval)
      setState('error')
    } finally {
      setTimeout(() => setState('idle'), 5000)
    }
  }, [state, router])

  // Auto-refresh every 30 min
  useEffect(() => {
    const interval = setInterval(runRefresh, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [runRefresh])

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '8px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: state === 'loading' ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
  }

  if (state === 'loading') return (
    <div style={{ ...baseStyle, background: '#1a2235', color: '#8a7a4a', cursor: 'default' }}>
      <span style={{
        width: '12px', height: '12px', borderRadius: '50%',
        border: '2px solid #c9a84c44', borderTopColor: '#c9a84c',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span className="hidden sm:inline">{MESSAGES[msgIndex]}</span>
    </div>
  )

  if (state === 'done') return (
    <div className="slide-up" style={{ ...baseStyle, background: '#0a1a0a', color: '#4ade80', border: '1px solid #1a3a1a' }}>
      ✓ {jobCount !== null ? `${jobCount} jobs` : 'Updated'}
    </div>
  )

  if (state === 'error') return (
    <button onClick={runRefresh} style={{ ...baseStyle, background: '#1a0a0a', color: '#f87171', border: '1px solid #5a1a1a' }}>
      ↻ Retry
    </button>
  )

  return (
    <div className="flex items-center gap-2">
      {lastRefresh && (
        <span className="text-[10px] hidden sm:block" style={{ color: '#2a3a55' }}>
          {lastRefresh}
        </span>
      )}
      <button
        onClick={runRefresh}
        style={{
          ...baseStyle,
          background: '#1a2235',
          color: '#c9a84c',
          border: '1px solid #c9a84c44',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.background = '#243048'
          el.style.borderColor = '#c9a84c88'
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.background = '#1a2235'
          el.style.borderColor = '#c9a84c44'
          el.style.transform = 'translateY(0)'
        }}>
        ↻ Refresh
      </button>
    </div>
  )
}
