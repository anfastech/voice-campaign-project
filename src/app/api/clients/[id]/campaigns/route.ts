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

    const campaigns = await prisma.campaign.findMany({
      where: { agentId: { in: agentIds } },
      include: {
        agent: { select: { name: true } },
        _count: { select: { contacts: true, calls: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Client campaigns error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}
