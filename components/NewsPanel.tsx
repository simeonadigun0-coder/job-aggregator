/* eslint-disable */
'use client'

import { useEffect, useState, useCallback } from 'react'

interface NewsItem {
  headline: string
  summary: string
  url: string
  source: string
  category: string
  publishedAt: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Hiring:  '#c9a84c',
  Remote:  '#7a9ac0',
  Layoffs: '#c07a7a',
  Salaries:'#7ac07a',
  Tech:    '#9a7ac0',
  Market:  '#6b7a99',
}

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/news', { cache: 'no-store' })
      const data = await res.json()
      if (data.news?.length) {
        setNews(data.news)
        setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    // Refresh news every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  const visible = expanded ? news : news.slice(0, 3)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(#7a9ac0, #3a5a80)' }} />
          <h2 className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: '#7a9ac0', letterSpacing: '0.15em' }}>Market Intelligence</h2>
          {lastUpdated && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: '#0a1526', color: '#3a5a80', border: '1px solid #1e2d4a' }}>
              {lastUpdated}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchNews} className="text-xs transition-all"
            style={{ color: '#3a4a6a' }}>
            ↻ refresh
          </button>
          {news.length > 3 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs transition-all"
              style={{ color: '#3a4a6a' }}>
              {expanded ? 'Show less' : `See all ${news.length}`}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl p-5 flex items-center gap-3"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c9a84c' }} />
          <span className="text-xs" style={{ color: '#6b7a99' }}>Loading latest market news...</span>
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          <p className="text-xs" style={{ color: '#3a4a6a' }}>No news available right now.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {visible.map((item, i) => {
            const color = CATEGORY_COLORS[item.category] || '#6b7a99'
            const timeAgo = item.publishedAt
              ? formatTimeAgo(new Date(item.publishedAt))
              : ''

            return (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl p-4 flex flex-col gap-2 transition-all block"
                style={{
                  background: '#111827',
                  border: '1px solid #1e2d4a',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a3d5a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2d4a')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
                    {item.category}
                  </span>
                  <span className="text-[10px]" style={{ color: '#3a4a6a' }}>{item.source}</span>
                </div>

                <p className="text-xs font-semibold leading-snug" style={{ color: '#e8dcc8' }}>
                  {item.headline}
                </p>

                {item.summary && (
                  <p className="text-[11px] leading-relaxed" style={{ color: '#6b7a99' }}>
                    {item.summary}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-1"
                  style={{ borderTop: '1px solid #1a2235' }}>
                  <span className="text-[10px]" style={{ color: '#3a4a6a' }}>{timeAgo}</span>
                  <span className="text-[10px]" style={{ color: '#c9a84c' }}>Read more →</span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </section>
  )
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}
