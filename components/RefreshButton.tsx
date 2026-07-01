'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const LOADING_MESSAGES = [
  'Fetching jobs...',
  'Scanning sources...',
  'Pulling Nigerian jobs...',
  'Checking remote roles...',
  'Matching to your resume...',
  'Almost done...',
]

export default function RefreshButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [jobCount, setJobCount] = useState<number | null>(null)
  const router = useRouter()

  const runRefresh = useCallback(async () => {
    if (state === 'loading') return
    setState('loading')
    setLoadingMsg(LOADING_MESSAGES[0])

    // Cycle through loading messages so user knows it's working
    let msgIndex = 0
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIndex])
    }, 2500)

    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      clearInterval(msgInterval)

      if (data.error) {
        setState('error')
      } else {
        setState('done')
        setJobCount(data.jobsFetched || 0)
        setLastRefresh(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        router.refresh()
      }
    } catch {
      clearInterval(msgInterval)
      setState('error')
    } finally {
      setTimeout(() => setState('idle'), 5000)
    }
  }, [state, router])

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(runRefresh, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [runRefresh])

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: '#1a2235', border: '1px solid #2a3d5a' }}>
        <span className="w-3 h-3 rounded-full border border-yellow-500 border-t-transparent animate-spin shrink-0"
          style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
        <span className="text-xs hidden sm:block" style={{ color: '#8a7a4a' }}>{loadingMsg}</span>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: '#0a1a0a', border: '1px solid #1a3a1a' }}>
        <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
          ✓ {jobCount !== null ? `${jobCount} jobs` : 'Updated'}
        </span>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <button onClick={runRefresh}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #5a1a1a' }}>
        ↻ Retry
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {lastRefresh && (
        <span className="text-[10px] hidden sm:block" style={{ color: '#2a3a55' }}>
          {lastRefresh}
        </span>
      )}
      <button
        onClick={runRefresh}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all"
        style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #c9a84c44' }}
      >
        ↻ Refresh
      </button>
    </div>
  )
}
