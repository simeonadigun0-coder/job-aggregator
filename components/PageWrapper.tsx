/* eslint-disable */
'use client'

import { useEffect, useRef } from 'react'

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = '0'
      ref.current.style.transform = 'translateY(8px)'
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transition = 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)'
          ref.current.style.opacity = '1'
          ref.current.style.transform = 'translateY(0)'
        }
      })
    }
  }, [])

  return <div ref={ref}>{children}</div>
}
