import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [campaign, contacts, calls] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id },
        select: { status: true },
      }),
      prisma.campaignContact.findMany({
        where: { campaignId: id },
        select: {
          id: true,
          contactId: true,
          status: true,
          contact: { select: { name: true, phoneNumber: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.call.findMany({
        where: { campaignId: id },
        select: { contactId: true, status: true },
        orderBy: { startedAt: 'desc' },
      }),
    ])

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build map of contactId → latest call status
    const latestCallStatus = new Map<string, string>()
    for (const call of calls) {
      if (!latestCallStatus.has(call.contactId)) {
        latestCallStatus.set(call.contactId, call.status)
      }
    }

    return NextResponse.json({
      campaignStatus: campaign.status,
      contacts: contacts.map((cc) => ({
        id: cc.id,
        name: cc.contact?.name || null,
        phone: cc.contact?.phoneNumber || '',
        contactStatus: cc.status,
        callStatus: latestCallStatus.get(cc.contactId) || null,
      })),
    })
  } catch (error) {
    console.error('Live status error:', error)
    return NextResponse.json({ error: 'Failed to fetch live status' }, { status: 500 })
  }
}
