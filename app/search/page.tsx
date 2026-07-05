/* eslint-disable */
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

interface Job {
  id: string
  title: string
  company: string | null
  location: string | null
  job_type: string
  source: string
  apply_url: string | null
  posted_at: string | null
  description: string | null
  country: string | null
}

const TRENDING = ['Product Manager', 'Software Engineer', 'Data Analyst', 'Finance Manager', 'Remote Marketing', 'UI Designer']

const SOURCE_LABELS: Record<string, string> = {
  remotive: 'Remotive', wwr: 'We Work Remotely', themuse: 'The Muse',
  adzuna: 'Adzuna', jsearch: 'LinkedIn/Indeed', jobberman: 'Jobberman',
  myjobmag: 'MyJobMag', ngcareers: 'NgCareers',
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string, type: string, country: string) => {
    if (!q.trim()) { setJobs([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams({ q, type, country })
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setJobs(data.jobs || [])

      // Save to recent searches
      const recent: string[] = JSON.parse(localStorage.getItem('jh_recent_searches') || '[]')
      const updated = [q, ...recent.filter(r => r !== q)].slice(0, 5)
      localStorage.setItem('jh_recent_searches', JSON.stringify(updated))
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query, typeFilter, countryFilter), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, typeFilter, countryFilter, search])

  const [recentSearches, setRecentSearches] = useState<string[]>([])
  useEffect(() => {
    setRecentSearches(JSON.parse(localStorage.getItem('jh_recent_searches') || '[]'))
  }, [])

  function formatTime(dateStr: string | null) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    return `${d}d ago`
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>

      {/* Header */}
      <header style={{ background: '#0a0e1a', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-xs shrink-0" style={{ color: '#6b7a99' }}>← Back</Link>
          <div className="flex-1 relative">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search job title, skill, company..."
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e8dcc8', fontSize: '16px' }}
              onFocus={e => e.target.style.borderColor = '#c9a84c'}
              onBlur={e => e.target.style.borderColor = '#1e2d4a'}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
            )}
          </div>
          <div className="shrink-0 hidden sm:flex">
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          {['all', 'remote', 'hybrid'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="text-xs px-3 py-1.5 rounded-full capitalize transition-all"
              style={{
                background: typeFilter === t ? '#c9a84c' : '#111827',
                color: typeFilter === t ? '#000' : '#6b7a99',
                border: `1px solid ${typeFilter === t ? '#c9a84c' : '#1e2d4a'}`,
                fontWeight: typeFilter === t ? 700 : 400,
              }}>
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', background: '#1e2d4a' }} />
          {/* Country filter */}
          {[['all', 'Worldwide'], ['nigeria', '🇳🇬 Nigeria'], ['international', '🌍 International']].map(([val, label]) => (
            <button key={val} onClick={() => setCountryFilter(val)}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{
                background: countryFilter === val ? '#c9a84c' : '#111827',
                color: countryFilter === val ? '#000' : '#6b7a99',
                border: `1px solid ${countryFilter === val ? '#c9a84c' : '#1e2d4a'}`,
                fontWeight: countryFilter === val ? 700 : 400,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Empty / suggestions */}
        {!searched && (
          <div className="space-y-6">
            {recentSearches.length > 0 && (
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#3a4a6a' }}>Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <button key={s} onClick={() => setQuery(s)}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{ background: '#111827', color: '#6b7a99', border: '1px solid #1e2d4a' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#3a4a6a' }}>Trending Searches</p>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ background: '#111827', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {searched && !loading && (
          <p className="text-xs" style={{ color: '#6b7a99' }}>
            {jobs.length > 0 ? `${jobs.length} result${jobs.length !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
          </p>
        )}

        {/* No results */}
        {searched && !loading && jobs.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#e8dcc8' }}>No jobs found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs mb-4" style={{ color: '#6b7a99' }}>Try a broader search term or different filters</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {TRENDING.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: '#1a2235', color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                  Try &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {jobs.length > 0 && (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {jobs.map(job => {
              const isNew = job.posted_at && Date.now() - new Date(job.posted_at).getTime() < 2 * 60 * 60 * 1000
              return (
                <div key={job.id} className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
                  <div className="flex items-start gap-3">
                    {/* Company initial */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #1e2d4a' }}>
                      {(job.company || job.title || 'J')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {isNew && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#0a1a0a', color: '#4ade80', border: '1px solid #1a3a1a' }}>New</span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                          style={{ background: '#1a2235', color: '#7a9ac0', border: '1px solid #1e2d4a' }}>
                          {job.job_type}
                        </span>
                        {job.country === 'Nigeria' && (
                          <span className="text-[10px]">🇳🇬</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold mb-0.5" style={{ color: '#e8dcc8' }}>{job.title}</h3>
                      <p className="text-xs" style={{ color: '#6b7a99' }}>
                        {job.company || 'Unknown'}{job.location ? ` · ${job.location}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: '#3a4a6a' }}>
                      {formatTime(job.posted_at)}
                    </span>
                  </div>

                  {job.description && (
                    <p className="text-xs leading-relaxed" style={{ color: '#6b7a99' }}>
                      {job.description.slice(0, 120)}...
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid #1a2235' }}>
                    <span className="text-[10px]" style={{ color: '#3a4a6a' }}>
                      {SOURCE_LABELS[job.source] || job.source}
                    </span>
                    {job.apply_url && (
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                        className="ml-auto text-xs font-semibold px-4 py-2 rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
                        Apply to {job.company || 'this role'}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
