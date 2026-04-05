import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✓ set (' + process.env.DATABASE_URL.slice(0, 30) + '...)' : '✗ MISSING',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ set' : '✗ MISSING',
      AUTH_SECRET: process.env.AUTH_SECRET ? '✓ set' : '✗ MISSING',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
    },
  }

  // Test DB connection
  try {
    const start = Date.now()
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    checks.database = {
      status: '✓ connected',
      latency: `${Date.now() - start}ms`,
      users: userCount,
      clients: clientCount,
    }
  } catch (err) {
    checks.database = {
      status: '✗ FAILED',
      error: err instanceof Error ? err.message : String(err),
    }
  }

  // List admin users (email only)
  try {
    const admins = await prisma.user.findMany({
      select: { email: true, role: true },
    })
    checks.adminUsers = admins
  } catch (err) {
    checks.adminUsers = { error: err instanceof Error ? err.message : String(err) }
  }

  return NextResponse.json(checks, { status: 200 })
}
