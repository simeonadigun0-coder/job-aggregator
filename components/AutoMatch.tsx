'use client'

import { useEffect } from 'react'

export default function AutoMatch() {
  useEffect(() => {
    // Silently trigger matching for this user in background
    // Only runs once per session
    if (sessionStorage.getItem('matched')) return

    fetch('/api/match', { method: 'POST' })
      .then(() => sessionStorage.setItem('matched', '1'))
      .catch(() => {})
  }, [])

  return null // Invisible component
}
