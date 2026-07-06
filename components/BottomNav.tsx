/* eslint-disable */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: '⌂' },
  { href: '/jobs/all', label: 'Jobs', icon: '💼' },
  { href: '/search', label: 'Search', icon: '🔍' },
  { href: '/jobs/saved', label: 'Saved', icon: '🔖' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: 'rgba(10,14,26,0.95)',
        borderTop: '1px solid #1e2d4a',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
      {TABS.map(tab => {
        const active = pathname === tab.href ||
          (tab.href !== '/dashboard' && pathname.startsWith(tab.href))

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative"
            style={{
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}>

            {/* Active pill background */}
            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(201,168,76,0.12)',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            )}

            <span
              style={{
                fontSize: '20px',
                lineHeight: 1,
                position: 'relative',
                zIndex: 1,
                opacity: active ? 1 : 0.35,
                transform: active ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: active ? 700 : 400,
                color: active ? '#c9a84c' : '#3a4a6a',
                position: 'relative',
                zIndex: 1,
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
