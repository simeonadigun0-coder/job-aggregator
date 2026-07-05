/* eslint-disable */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResumeUpload({ currentFilename }: { currentFilename: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(currentFilename)
  const [justUploaded, setJustUploaded] = useState(false)
  const router = useRouter()

  // Keep local state in sync with prop
  useEffect(() => {
    setUploadedFilename(currentFilename)
  }, [currentFilename])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setJustUploaded(false)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed. Please try again.')
      } else {
        // Update local state immediately — don't wait for router.refresh()
        setUploadedFilename(file.name)
        setJustUploaded(true)
        setTimeout(() => setJustUploaded(false), 5000)
        // Also refresh server data in background
        router.refresh()
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-uploaded if needed
      e.target.value = ''
    }
  }

  const hasResume = !!uploadedFilename

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>

      {/* Main row */}
      <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: hasResume ? '#0a1a0a' : '#1a1500',
              border: `1px solid ${hasResume ? '#1a3a1a' : '#c9a84c44'}`,
            }}>
            <span className="text-base">{hasResume ? '✓' : '📄'}</span>
          </div>

          {/* Text */}
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>
              {hasResume ? 'Resume uploaded' : 'Upload your CV and unlock AI job matching'}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: hasResume ? '#4ade80' : '#6b7a99' }}>
              {hasResume
                ? uploadedFilename
                : 'PDF, Word, or text file · We match every job to your profile instantly'}
            </p>
            {error && (
              <p className="text-xs mt-1 font-medium" style={{ color: '#f87171' }}>{error}</p>
            )}
            {justUploaded && (
              <p className="text-xs mt-1 font-medium" style={{ color: '#4ade80' }}>
                Uploaded successfully. Matching your CV to available jobs now...
              </p>
            )}
          </div>
        </div>

        {/* Upload button */}
        <label
          className="shrink-0 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all tracking-wider uppercase flex items-center gap-2"
          style={{
            background: uploading ? '#1a2235' : hasResume ? '#1a2235' : 'linear-gradient(135deg, #c9a84c, #8a6f2e)',
            color: uploading ? '#6b7a99' : hasResume ? '#c9a84c' : '#000',
            border: hasResume ? '1px solid #c9a84c44' : 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.08em',
          }}>
          {uploading && (
            <span className="w-3 h-3 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: '#6b7a99', borderTopColor: 'transparent' }} />
          )}
          {uploading ? 'Uploading...' : hasResume ? 'Replace CV' : 'Upload Your CV'}
          <input
            type="file"
            accept="application/pdf,.pdf,.doc,.docx,.txt,.rtf"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Progress bar while uploading */}
      {uploading && (
        <div className="h-0.5 w-full" style={{ background: '#1e2d4a' }}>
          <div className="h-0.5 animate-pulse" style={{ background: 'linear-gradient(90deg, #c9a84c, #8a6f2e)', width: '100%' }} />
        </div>
      )}

      {/* What happens after upload — shown only when no resume */}
      {!hasResume && !uploading && (
        <div className="px-5 pb-4 flex items-center gap-6 flex-wrap">
          {[
            'Every job scored against your profile',
            'Best matches rise to the top',
            'Auto-apply sends tailored applications',
          ].map(benefit => (
            <div key={benefit} className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: '#4ade80' }}>✓</span>
              <span className="text-[10px]" style={{ color: '#6b7a99' }}>{benefit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
