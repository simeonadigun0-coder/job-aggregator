'use client'

import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs px-3 py-1.5 rounded-lg transition-all tracking-wider uppercase"
      style={{ color: '#6b7a99', border: '1px solid #1e2d4a' }}
      onMouseEnter={e => {
        (e.target as HTMLElement).style.color = '#c9a84c'
        ;(e.target as HTMLElement).style.borderColor = '#c9a84c44'
      }}
      onMouseLeave={e => {
        (e.target as HTMLElement).style.color = '#6b7a99'
        ;(e.target as HTMLElement).style.borderColor = '#1e2d4a'
      }}
    >
      Sign Out
    </button>
  )
}
