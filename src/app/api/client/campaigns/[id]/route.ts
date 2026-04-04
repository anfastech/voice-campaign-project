import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const agentIds = await getClientAgentIds(user.id)

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true } },
        contacts: {
          include: { contact: { select: { id: true, name: true, phoneNumber: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { contacts: true, calls: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!agentIds.includes(campaign.agentId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { totalCost, ...safe } = campaign
    return NextResponse.json({
      ...safe,
      totalContacts: campaign.totalContacts,
      completedCalls: campaign.completedCalls,
      successfulCalls: campaign.successfulCalls,
      failedCalls: campaign.failedCalls,
    })
  } catch (error) {
    console.error('Client campaign GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}
