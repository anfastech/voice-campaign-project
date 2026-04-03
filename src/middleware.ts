import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes — no auth needed
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Check JWT token (Edge-compatible, no Prisma/crypto dependency)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
  })

  // Not logged in → redirect to login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = token.role as string

  // Root → redirect based on role
  if (pathname === '/') {
    const dest = role === 'client' ? '/client/dashboard' : '/analytics'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Client trying to access admin routes
  if (role === 'client' && !pathname.startsWith('/client') && !pathname.startsWith('/api/client') && !pathname.startsWith('/api/auth')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/client/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
