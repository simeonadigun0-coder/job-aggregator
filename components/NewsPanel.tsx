'use client'

import { useEffect, useState } from 'react'

interface NewsItem {
  headline: string
  summary: string
  country: string
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

const CATEGORY_COLORS: Record<string, string> = {
  Hiring:   '#c9a84c',
  Remote:   '#7a9ac0',
  Layoffs:  '#c07a7a',
  Salaries: '#7ac07a',
  Skills:   '#9a7ac0',
  Market:   '#6b7a99',
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: '#4ade80',
  neutral:  '#c9a84c',
  negative: '#f87171',
}

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Cache news in sessionStorage so it doesn't refetch on every render
    const cached = sessionStorage.getItem('jobmatch_news')
    const cachedTime = sessionStorage.getItem('jobmatch_news_time')
    const oneHour = 60 * 60 * 1000

    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < oneHour) {
      setNews(JSON.parse(cached))
      setLastUpdated(new Date(parseInt(cachedTime)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      setLoading(false)
      return
    }

    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        if (data.news?.length) {
          setNews(data.news)
          sessionStorage.setItem('jobmatch_news', JSON.stringify(data.news))
          sessionStorage.setItem('jobmatch_news_time', Date.now().toString())
          setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visibleNews = expanded ? news : news.slice(0, 3)

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(#7a9ac0, #3a5a80)' }} />
          <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#7a9ac0', letterSpacing: '0.15em' }}>
            Market Intelligence
          </h2>
          {lastUpdated && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#0a1526', color: '#3a5a80', border: '1px solid #1e2d4a' }}>
              Updated {lastUpdated}
            </span>
          )}
        </div>
        {news.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs transition-all"
            style={{ color: '#3a4a6a' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#7a9ac0'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#3a4a6a'}
          >
            {expanded ? 'Show less ↑' : `See all ${news.length} ↓`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl p-5 flex items-center gap-3" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c9a84c' }} />
          <span className="text-xs" style={{ color: '#6b7a99' }}>Fetching market intelligence...</span>
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-xl p-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          <p className="text-xs" style={{ color: '#3a4a6a' }}>No news available right now.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {visibleNews.map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex flex-col gap-2 transition-all"
              style={{ background: '#111827', border: '1px solid #1e2d4a' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a3d5a'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a'}
            >
              {/* Top row — category + country */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: (CATEGORY_COLORS[item.category] || '#6b7a99') + '22',
                    color: CATEGORY_COLORS[item.category] || '#6b7a99',
                    border: `1px solid ${(CATEGORY_COLORS[item.category] || '#6b7a99')}44`
                  }}
                >
                  {item.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: SENTIMENT_DOT[item.sentiment] || '#6b7a99' }} />
                  <span className="text-[10px]" style={{ color: '#3a4a6a' }}>{item.country}</span>
                </div>
              </div>

              {/* Headline */}
              <p className="text-xs font-semibold leading-snug" style={{ color: '#e8dcc8' }}>
                {item.headline}
              </p>

              {/* Summary */}
              <p className="text-[11px] leading-relaxed" style={{ color: '#6b7a99' }}>
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
