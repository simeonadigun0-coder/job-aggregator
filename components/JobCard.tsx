'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface JobCardProps {
  matchId: string
  title: string
  company: string | null
  location: string | null
  jobType: string
  source: string
  applyUrl: string | null
  matchScore: number
  matchReason: string | null
  isStrongMatch: boolean
  status: string
  postedAt: string | null
}

export default function JobCard(props: JobCardProps) {
  const [status, setStatus] = useState(props.status)
  const supabase = createClient()

  async function updateStatus(newStatus: string) {
    setStatus(newStatus)
    await supabase.from('job_matches').update({ status: newStatus }).eq('id', props.matchId)
  }

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition ${
        props.isStrongMatch ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {props.isStrongMatch && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Strong Match
              </span>
            )}
            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
              {props.jobType}
            </span>
            <span className="text-[10px] text-slate-400">{props.source}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 truncate">{props.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {props.company || 'Unknown company'} {props.location ? `· ${props.location}` : ''}
          </p>
          {props.matchReason && (
            <p className="text-xs text-slate-600 mt-2 italic">&ldquo;{props.matchReason}&rdquo;</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div
            className={`text-lg font-bold ${
              props.matchScore >= 75
                ? 'text-emerald-600'
                : props.matchScore >= 50
                ? 'text-amber-600'
                : 'text-slate-400'
            }`}
          >
            {props.matchScore}%
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {props.applyUrl && (
          <a
            href={props.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => updateStatus('applied')}
            className="text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Apply now
          </a>
        )}
        {status !== 'dismissed' ? (
          <button
            onClick={() => updateStatus('dismissed')}
            className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
          >
            Dismiss
          </button>
        ) : (
          <span className="text-xs text-slate-400 px-3 py-1.5">Dismissed</span>
        )}
      </div>
    </div>
  )
}
