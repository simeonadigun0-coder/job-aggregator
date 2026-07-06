/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollTop}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        zIndex: 30,
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'rgba(17,24,39,0.9)',
        border: '1px solid #1e2d4a',
        color: '#c9a84c',
        fontSize: '16px',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      ↑
    </button>
  )
}
