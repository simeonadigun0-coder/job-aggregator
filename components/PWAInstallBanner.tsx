'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if already installed (running as standalone PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa_dismissed')) return

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      // Show iOS manual instructions after 3 seconds
      setTimeout(() => setShow(true), 3000)
      return
    }

    // Android/Desktop Chrome — listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Also show after 5 seconds even if prompt hasn't fired (some browsers delay it)
    const timer = setTimeout(() => {
      if (!prompt) setShow(true)
    }, 5000)

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShow(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  function handleInstall() {
    if (prompt) {
      prompt.prompt()
      prompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          setInstalled(true)
          setShow(false)
        }
      })
    }
  }

  function handleDismiss() {
    setShow(false)
    setIsDismissed(true)
    sessionStorage.setItem('pwa_dismissed', '1')
  }

  if (!show || isDismissed || installed) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{ background: 'rgba(6,9,18,0.95)', borderTop: '1px solid #1e2d4a', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)' }}>
          <span className="text-base font-bold text-black">J</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>
            Install JobHunt
          </p>
          {isIOS ? (
            <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
              Tap <strong style={{ color: '#c9a84c' }}>Share</strong> then <strong style={{ color: '#c9a84c' }}>&quot;Add to Home Screen&quot;</strong> to install
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
              Get daily job alerts on your home screen — works offline too
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="text-xs font-semibold px-4 py-2 rounded-lg tracking-wider uppercase"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6f2e)', color: '#000' }}
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-xs px-3 py-2 rounded-lg"
            style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}
          >
            {isIOS ? 'OK' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
