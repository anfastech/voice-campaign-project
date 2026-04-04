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
      call: { agentId: { in: agentIds } },
    }
    if (from || to) {
      where.call = {
        ...(where.call as object),
        startedAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      }
    }

    const breakdown = await prisma.callTopic.groupBy({
      by: ['topicId'],
      where,
      _count: true,
    })

    // Fetch topic details
    const topicIds = breakdown.map((b) => b.topicId)
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, name: true, color: true },
    })
    const topicMap = new Map(topics.map((t) => [t.id, t]))

    const result = breakdown
      .map((b) => {
        const topic = topicMap.get(b.topicId)
        return topic ? { topicId: b.topicId, topicName: topic.name, color: topic.color, count: b._count } : null
      })
      .filter(Boolean)
      .sort((a, b) => b!.count - a!.count)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Topic breakdown error:', error)
    return NextResponse.json({ error: 'Failed to fetch topic breakdown' }, { status: 500 })
  }
}
