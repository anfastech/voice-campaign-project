import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user
  if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const agentIds = await getClientAgentIds(user.id)
  if (agentIds.length === 0) {
    return NextResponse.json({ totalCalls: 0, successfulCalls: 0, avgDuration: 0, totalCost: 0 })
  }

  const [stats, successful] = await Promise.all([
    prisma.call.aggregate({
      where: { agentId: { in: agentIds } },
      _count: true,
      _sum: { duration: true, cost: true },
      _avg: { duration: true },
    }),
    prisma.call.count({
      where: { agentId: { in: agentIds }, status: 'COMPLETED' },
    }),
  ])

  return NextResponse.json({
    totalCalls: stats._count,
    successfulCalls: successful,
    avgDuration: Math.round(stats._avg.duration ?? 0),
    totalCost: stats._sum.cost ?? 0,
    totalDuration: stats._sum.duration ?? 0,
  })
}
