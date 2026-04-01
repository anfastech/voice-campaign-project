import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const dateFilter: Record<string, unknown> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    const callWhere: Record<string, unknown> = {}
    if (from || to) callWhere.startedAt = dateFilter

    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        provider: true,
      },
    })

    const results = await Promise.all(
      agents.map(async (agent) => {
        const where = { ...callWhere, agentId: agent.id }

        const [total, completed, agg] = await Promise.all([
          prisma.call.count({ where }),
          prisma.call.count({ where: { ...where, status: 'COMPLETED' } }),
          prisma.call.aggregate({
            where,
            _avg: { duration: true },
            _sum: { cost: true },
          }),
        ])

        return {
          id: agent.id,
          name: agent.name,
          provider: agent.provider,
          totalCalls: total,
          successfulCalls: completed,
          successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          avgDuration: Math.round(agg._avg.duration ?? 0),
          totalCost: Math.round((agg._sum.cost ?? 0) * 100) / 100,
        }
      })
    )

    // Sort by total calls descending
    results.sort((a, b) => b.totalCalls - a.totalCalls)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Agent comparison error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent comparison' }, { status: 500 })
  }
}
