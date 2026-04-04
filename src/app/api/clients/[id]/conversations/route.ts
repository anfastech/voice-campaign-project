import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const { id: clientId } = await params
    const agentIds = await getClientAgentIds(clientId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { agentId: { in: agentIds } }
    if (status && status !== 'ALL') where.status = status

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          contact: { select: { name: true, phoneNumber: true } },
          agent: { select: { name: true } },
          campaign: { select: { name: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.call.count({ where }),
    ])

    return NextResponse.json({ calls, total, page, limit })
  } catch (error) {
    console.error('Client conversations error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
