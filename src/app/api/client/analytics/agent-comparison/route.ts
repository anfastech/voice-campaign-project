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

  // Suppress unused variable warning — query params reserved for future filtering
  void request

  const agents = await prisma.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true },
  })

  const callStats = await prisma.call.groupBy({
    by: ['agentId'],
    where: { agentId: { in: agentIds } },
    _count: true,
    _sum: { duration: true },
    _avg: { duration: true },
  })

  const successCounts = await prisma.call.groupBy({
    by: ['agentId'],
    where: { agentId: { in: agentIds }, status: 'COMPLETED' },
    _count: true,
  })

  const successMap = new Map(successCounts.map((s) => [s.agentId, s._count]))

  const data = agents.map((agent) => {
    const stats = callStats.find((s) => s.agentId === agent.id)
    const totalCalls = stats?._count ?? 0
    const successfulCalls = successMap.get(agent.id) ?? 0

    return {
      id: agent.id,
      name: agent.name,
      totalCalls,
      successfulCalls,
      successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100 * 100) / 100 : 0,
      avgDuration: Math.round(stats?._avg?.duration ?? 0),
    }
  })

  return NextResponse.json(data)
}
