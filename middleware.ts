import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = path.startsWith('/login') || path.startsWith('/api/') || path.startsWith('/subscribe')

  // Not logged in — redirect to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in + on login page — redirect to dashboard
  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Paywall check — only for dashboard and profile
  if (user && (path.startsWith('/dashboard') || path.startsWith('/profile'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, is_exempt')
      .eq('id', user.id)
      .single()

    if (profile && !profile.is_exempt) {
      const status = profile.subscription_status
      const trialEnded = profile.trial_ends_at
        ? new Date(profile.trial_ends_at) < new Date()
        : true

      // Block if trial expired and not subscribed
      if (status !== 'active' && trialEnded) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscribe'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
