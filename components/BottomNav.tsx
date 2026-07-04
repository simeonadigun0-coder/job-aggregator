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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{ background: '#0a0e1a', borderTop: '1px solid #1e2d4a', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {TABS.map(tab => {
        const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
        return (
          <Link key={tab.href} href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all"
            style={{ textDecoration: 'none' }}>
            <span className="text-lg leading-none" style={{ opacity: active ? 1 : 0.4 }}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-medium"
              style={{ color: active ? '#c9a84c' : '#3a4a6a' }}>
              {tab.label}
            </span>
            {active && (
              <div className="absolute top-0 w-8 h-0.5 rounded-full"
                style={{ background: '#c9a84c' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
