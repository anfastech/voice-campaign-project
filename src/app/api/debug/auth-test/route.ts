import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const steps: { step: string; status: string; detail?: unknown; ms?: number }[] = []
  const t = () => Date.now()

  try {
    const body = await req.json()
    const { email, password } = body
    steps.push({ step: 'parse-body', status: '✓', detail: { email, passwordLength: password?.length } })

    // Step 1: Find in User table (admin)
    let start = t()
    let user: any = null
    try {
      user = await prisma.user.findUnique({ where: { email } })
      steps.push({ step: 'db-user-lookup', status: user ? '✓ found' : '✗ not found', detail: user ? { id: user.id, email: user.email, role: user.role, hasPassword: !!user.password } : null, ms: t() - start })
    } catch (err) {
      steps.push({ step: 'db-user-lookup', status: '✗ ERROR', detail: err instanceof Error ? err.message : String(err), ms: t() - start })
    }

    // Step 2: Find in Client table
    start = t()
    let client: any = null
    try {
      client = await prisma.client.findUnique({ where: { email } })
      steps.push({ step: 'db-client-lookup', status: client ? '✓ found' : '✗ not found', detail: client ? { id: client.id, email: client.email, isActive: client.isActive, hasPasswordHash: !!client.passwordHash } : null, ms: t() - start })
    } catch (err) {
      steps.push({ step: 'db-client-lookup', status: '✗ ERROR', detail: err instanceof Error ? err.message : String(err), ms: t() - start })
    }

    // Step 3: Test bcrypt for admin
    if (user?.password && password) {
      start = t()
      try {
        const valid = await bcrypt.compare(password, user.password)
        steps.push({ step: 'bcrypt-admin', status: valid ? '✓ password matches' : '✗ password wrong', ms: t() - start })
      } catch (err) {
        steps.push({ step: 'bcrypt-admin', status: '✗ ERROR', detail: err instanceof Error ? err.message : String(err), ms: t() - start })
      }
    }

    // Step 4: Test bcrypt for client
    if (client?.passwordHash && password) {
      start = t()
      try {
        const valid = await bcrypt.compare(password, client.passwordHash)
        steps.push({ step: 'bcrypt-client', status: valid ? '✓ password matches' : '✗ password wrong', ms: t() - start })
      } catch (err) {
        steps.push({ step: 'bcrypt-client', status: '✗ ERROR', detail: err instanceof Error ? err.message : String(err), ms: t() - start })
      }
    }

    // Step 5: Check NextAuth env
    steps.push({
      step: 'nextauth-env',
      status: '✓',
      detail: {
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ set' : '✗ MISSING',
        AUTH_SECRET: process.env.AUTH_SECRET ? '✓ set' : '✗ MISSING',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
        NODE_ENV: process.env.NODE_ENV,
      },
    })

    return NextResponse.json({ steps })
  } catch (err) {
    steps.push({ step: 'fatal', status: '✗ ERROR', detail: err instanceof Error ? { message: err.message, stack: err.stack } : String(err) })
    return NextResponse.json({ steps }, { status: 500 })
  }
}
