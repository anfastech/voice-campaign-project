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
      total: 0,
      byStatus: { NEW: 0, CONTACTED: 0, QUALIFIED: 0, PROPOSAL: 0, WON: 0, LOST: 0 },
      totalValue: 0,
      wonValue: 0,
      conversionRate: 0,
    })
  }

  // Suppress unused variable warning
  void request

  const where = { agentId: { in: agentIds } }

  const [total, statusGroups, valueAgg, wonValueAgg] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.lead.aggregate({
      where,
      _sum: { value: true },
    }),
    prisma.lead.aggregate({
      where: { ...where, status: 'WON' },
      _sum: { value: true },
    }),
  ])

  const statusMap: Record<string, number> = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    PROPOSAL: 0,
    WON: 0,
    LOST: 0,
  }

  for (const group of statusGroups) {
    statusMap[group.status] = group._count
  }

  const wonCount = statusMap.WON
  const conversionRate = total > 0 ? Math.round((wonCount / total) * 100 * 100) / 100 : 0

  return NextResponse.json({
    total,
    byStatus: statusMap,
    totalValue: valueAgg._sum.value ?? 0,
    wonValue: wonValueAgg._sum.value ?? 0,
    conversionRate,
  })
}
