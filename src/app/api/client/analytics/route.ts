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
    return NextResponse.json({
      totalCalls: 0,
      successfulCalls: 0,
      avgDuration: 0,
      totalDuration: 0,
      successRate: 0,
      contactsReached: 0,
    })
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

  const [stats, successful, contactsReached] = await Promise.all([
    prisma.call.aggregate({
      where,
      _count: true,
      _sum: { duration: true, cost: true },
      _avg: { duration: true },
    }),
    prisma.call.count({
      where: { ...where, status: 'COMPLETED' },
    }),
    prisma.call.groupBy({
      by: ['contactId'],
      where: { ...where, status: 'COMPLETED' },
    }),
  ])

  const totalCalls = stats._count
  const totalCost = stats._sum.cost ?? 0
  const successRate = totalCalls > 0
    ? Math.round((successful / totalCalls) * 100 * 100) / 100
    : 0
  const costPerSuccess = successful > 0
    ? Math.round((totalCost / successful) * 100) / 100
    : 0

  return NextResponse.json({
    totalCalls,
    successfulCalls: successful,
    avgDuration: Math.round(stats._avg.duration ?? 0),
    totalDuration: stats._sum.duration ?? 0,
    successRate,
    contactsReached: contactsReached.length,
  })
}
