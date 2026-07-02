'use client'

import { useEffect, useState } from 'react'

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Already dismissed this session
    if (sessionStorage.getItem('pwa_dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      setTimeout(() => setShow(true), 3000)
      return
    }

    // For Android/Desktop: check if prompt was already stored on window
    if ((window as any).__pwaPrompt) {
      setShow(true)
      return
    }

    // Listen for the event
    const handler = (e: Event) => {
      e.preventDefault()
      ;(window as any).__pwaPrompt = e
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Cleanup
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    const prompt = (window as any).__pwaPrompt
    if (!prompt) {
      // Fallback — tell user how to install manually
      alert('To install: click the browser menu (three dots) and select "Install app" or "Add to Home Screen"')
      return
    }

    try {
      await prompt.prompt()
      const result = await prompt.userChoice
      if (result.outcome === 'accepted') {
        setShow(false)
        ;(window as any).__pwaPrompt = null
      }
    } catch (err) {
      console.error('Install failed:', err)
    }
  }

  function handleDismiss() {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('pwa_dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      style={{
        background: 'rgba(6,9,18,0.97)',
        borderTop: '1px solid #1e2d4a',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}
        >
          <span className="text-sm font-bold text-black">J</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: '#e8dcc8' }}>
            Install JobHunt
          </p>
          {isIOS ? (
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#6b7a99' }}>
              Tap <strong style={{ color: '#c9a84c' }}>Share</strong> then{' '}
              <strong style={{ color: '#c9a84c' }}>Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#6b7a99' }}>
              Fresh jobs daily. 7-day free trial, then NGN 1,500/month.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="text-xs font-semibold px-4 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)',
                color: '#000',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              color: '#6b7a99',
              border: '1px solid #1e2d4a',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {isIOS ? 'OK' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
