import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { contacts: { select: { contactId: true } } },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const cloned = await prisma.campaign.create({
      data: {
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        agentId: campaign.agentId,
        userId: campaign.userId,
        maxRetries: campaign.maxRetries,
        retryDelayMinutes: campaign.retryDelayMinutes,
        callsPerMinute: campaign.callsPerMinute,
        totalContacts: campaign.contacts.length,
        contacts: {
          create: campaign.contacts.map((c) => ({
            contactId: c.contactId,
          })),
        },
      },
    })

    return NextResponse.json(cloned)
  } catch (error) {
    console.error('Campaign clone error:', error)
    return NextResponse.json({ error: 'Failed to clone campaign' }, { status: 500 })
  }
}
