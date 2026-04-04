import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const agentIds = await getClientAgentIds(user.id)
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {
      agentId: { in: agentIds },
      status: { notIn: ['INITIATED', 'RINGING', 'IN_PROGRESS'] },
    }
    if (from || to) {
      where.startedAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const calls = await prisma.call.findMany({
      where,
      select: { status: true, metadata: true },
    })

    // Aggregate reasons: use metadata.termination_reason if available, else status
    const counts: Record<string, number> = {}
    for (const call of calls) {
      const meta = call.metadata as Record<string, unknown> | null
      const reason = (meta?.termination_reason as string) || call.status.replace(/_/g, ' ')
      const label = reason.charAt(0).toUpperCase() + reason.slice(1).toLowerCase()
      counts[label] = (counts[label] || 0) + 1
    }

    const result = Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reason ended error:', error)
    return NextResponse.json({ error: 'Failed to fetch reason ended data' }, { status: 500 })
  }
}
