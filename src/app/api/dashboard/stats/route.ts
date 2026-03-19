import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalCalls,
      todayCalls,
      activeCampaigns,
      totalContacts,
      todaySuccessful,
      todayFailed,
      todayCostAgg,
      avgDurationAgg,
      recentCalls,
    ] = await Promise.all([
      prisma.call.count(),
      prisma.call.count({ where: { startedAt: { gte: today } } }),
      prisma.campaign.count({ where: { status: 'RUNNING' } }),
      prisma.contact.count(),
      prisma.call.count({ where: { startedAt: { gte: today }, status: 'COMPLETED' } }),
      prisma.call.count({ where: { startedAt: { gte: today }, status: { in: ['FAILED', 'NO_ANSWER', 'BUSY'] } } }),
      prisma.call.aggregate({ where: { startedAt: { gte: today } }, _sum: { cost: true } }),
      prisma.call.aggregate({ where: { status: 'COMPLETED', startedAt: { gte: today } }, _avg: { duration: true } }),
      prisma.call.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: {
          contact: { select: { name: true, phoneNumber: true } },
          agent: { select: { name: true } },
          campaign: { select: { name: true } },
        },
      }),
    ])

    return NextResponse.json({
      totalCalls,
      todayCalls,
      activeCampaigns,
      totalContacts,
      todaySuccessful,
      todayFailed,
      todayCost: todayCostAgg._sum.cost ?? 0,
      avgDuration: Math.round(avgDurationAgg._avg.duration ?? 0),
      recentCalls,
      successRate: todayCalls > 0 ? Math.round((todaySuccessful / todayCalls) * 100) : 0,
    }, {
      headers: { 'Cache-Control': 'private, max-age=10' },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
