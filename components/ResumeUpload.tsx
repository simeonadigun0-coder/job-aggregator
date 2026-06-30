'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResumeUpload({ currentFilename }: { currentFilename: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        router.refresh()
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Your Resume</h3>
      <p className="text-xs text-slate-500 mb-3">
        {currentFilename ? `Current: ${currentFilename}` : 'Upload your resume to start getting matches'}
      </p>
      <label className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-slate-800 transition">
        {uploading ? 'Uploading...' : currentFilename ? 'Replace resume' : 'Upload resume (PDF)'}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
