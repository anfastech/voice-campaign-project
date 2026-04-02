import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const user = session?.user as any

  // Public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Root → redirect based on role
  if (pathname === '/') {
    const dest = user?.role === 'client' ? '/client/dashboard' : '/analytics'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Client trying to access admin routes
  if (user?.role === 'client' && !pathname.startsWith('/client') && !pathname.startsWith('/api/client') && !pathname.startsWith('/api/auth')) {
    // Allow client access to shared API routes for data fetching
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/client/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
