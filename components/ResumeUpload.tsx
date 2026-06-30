'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResumeUpload({ currentFilename }: { currentFilename: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl p-5 flex items-center justify-between gap-6"
      style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#0a0e1a', border: '1px solid #1e2d4a' }}>
          <span className="text-base">📄</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>Resume</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
            {currentFilename
              ? <span style={{ color: '#c9a84c' }}>✓ {currentFilename}</span>
              : 'No resume uploaded yet — upload to activate AI matching'}
          </p>
          {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
          {success && <p className="text-xs mt-1" style={{ color: '#4ade80' }}>Resume updated successfully</p>}
        </div>
      </div>

      <label className="shrink-0 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-all tracking-wider uppercase"
        style={{
          background: uploading ? '#4a3a1a' : 'linear-gradient(135deg, #c9a84c, #8a6f2e)',
          color: uploading ? '#8a7a4a' : '#000',
          letterSpacing: '0.08em'
        }}>
        {uploading ? 'Uploading...' : currentFilename ? 'Replace' : 'Upload PDF'}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  )
}
