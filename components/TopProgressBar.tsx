/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function TopProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setProgress(0)

    // Fake progress increments
    const t1 = setTimeout(() => setProgress(30), 50)
    const t2 = setTimeout(() => setProgress(60), 200)
    const t3 = setTimeout(() => setProgress(85), 400)
    const t4 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setVisible(false), 300)
    }, 600)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #c9a84c, #e8c97a)',
          transition: progress === 0
            ? 'none'
            : 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 0 8px rgba(201,168,76,0.6)',
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  )
}
