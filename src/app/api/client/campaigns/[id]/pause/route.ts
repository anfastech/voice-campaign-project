import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { pauseCampaign } from '@/lib/services/campaign-service'
import { prisma } from '@/lib/prisma'

export async function POST(
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
      select: { agentId: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!agentIds.includes(campaign.agentId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await pauseCampaign(id)
    return NextResponse.json({ message: 'Campaign paused', campaign: updated })
  } catch (error) {
    console.error('Client campaign pause error:', error)
    return NextResponse.json({ error: 'Failed to pause campaign' }, { status: 500 })
  }
}
