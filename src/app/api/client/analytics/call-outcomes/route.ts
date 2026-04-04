import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user
  if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const agentIds = await getClientAgentIds(user.id)
  if (agentIds.length === 0) {
    return NextResponse.json([])
  }

  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = { agentId: { in: agentIds } }
  if (from || to) {
    const startedAt: Record<string, Date> = {}
    if (from) startedAt.gte = new Date(from)
    if (to) startedAt.lte = new Date(to)
    where.startedAt = startedAt
  }

  const groups = await prisma.call.groupBy({
    by: ['status'],
    where,
    _count: true,
  })

  const data = groups.map((g) => ({
    status: g.status,
    count: g._count,
  }))

  return NextResponse.json(data)
}
