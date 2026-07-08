/* eslint-disable */
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#060912' }}>
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
          style={{ background: '#1a0a0a', border: '1px solid #5a1a1a' }}>
          <span className="text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: '#e8dcc8' }}>
          Something went wrong
        </h2>
        <p className="text-sm" style={{ color: '#6b7a99' }}>
          The dashboard hit an unexpected error. Your data is safe.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="text-xs font-semibold px-4 py-2.5 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}>
            Try again
          </button>
          <Link href="/jobs/all"
            className="text-xs px-4 py-2.5 rounded-lg"
            style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}>
            Browse Jobs
          </Link>
        </div>
        {error.digest && (
          <p className="text-[10px]" style={{ color: '#2a3a55' }}>
            Error: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
