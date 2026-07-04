'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface JobFiltersProps {
  total: number
  currentSort: string
  currentType: string
}

export default function JobFilters({ total, currentSort, currentType }: JobFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    p.set(key, value)
    router.push(`?${p.toString()}`)
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="text-xs" style={{ color: '#6b7a99' }}>
        {total} job{total !== 1 ? 's' : ''} found
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort */}
        <div className="flex items-center gap-1">
          {[
            { label: 'Best Match', value: 'score' },
            { label: 'Newest', value: 'date' },
          ].map(opt => (
            <button key={opt.value} onClick={() => update('sort', opt.value)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: currentSort === opt.value ? '#c9a84c' : '#111827',
                color: currentSort === opt.value ? '#000' : '#6b7a99',
                border: `1px solid ${currentSort === opt.value ? '#c9a84c' : '#1e2d4a'}`,
                fontWeight: currentSort === opt.value ? 700 : 400,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Type */}
        <div className="flex items-center gap-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'Remote', value: 'remote' },
            { label: 'Hybrid', value: 'hybrid' },
          ].map(opt => (
            <button key={opt.value} onClick={() => update('type', opt.value)}
              className="text-xs px-3 py-1.5 rounded-lg capitalize transition-all"
              style={{
                background: currentType === opt.value ? '#1a2235' : '#111827',
                color: currentType === opt.value ? '#7a9ac0' : '#6b7a99',
                border: `1px solid ${currentType === opt.value ? '#2a3d5a' : '#1e2d4a'}`,
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
