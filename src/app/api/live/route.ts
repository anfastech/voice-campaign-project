import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const [activeCalls, recentCalls, runningCampaigns, queuedContacts] = await Promise.all([
      // Active calls (IN_PROGRESS or RINGING or INITIATED)
      prisma.call.findMany({
        where: {
          status: { in: ['IN_PROGRESS', 'RINGING', 'INITIATED'] },
        },
        include: {
          contact: { select: { name: true, phoneNumber: true } },
          agent: { select: { name: true, provider: true } },
          campaign: { select: { name: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 50,
      }),

      // Recently completed calls (last 5 min)
      prisma.call.findMany({
        where: {
          status: { in: ['COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY'] },
          endedAt: { gte: fiveMinutesAgo },
        },
        include: {
          contact: { select: { name: true, phoneNumber: true } },
          agent: { select: { name: true } },
          campaign: { select: { name: true } },
        },
        orderBy: { endedAt: 'desc' },
        take: 20,
      }),

      // Running campaigns
      prisma.campaign.findMany({
        where: { status: 'RUNNING' },
        include: {
          agent: { select: { name: true } },
          _count: { select: { calls: true, contacts: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),

      // Queued contacts waiting to be called
      prisma.campaignContact.count({
        where: {
          status: 'PENDING',
          campaign: { status: 'RUNNING' },
        },
      }),
    ])

    return NextResponse.json({
      activeCalls,
      recentCalls,
      runningCampaigns,
      queuedContacts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Live monitor error:', error)
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 })
  }
}
