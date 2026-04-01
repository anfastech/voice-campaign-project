import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const dateFilter: Record<string, unknown> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    const where: Record<string, unknown> = {}
    if (from || to) where.startedAt = dateFilter

    const [
      totalCalls,
      completedCalls,
      failedCalls,
      noAnswerCalls,
      busyCalls,
      durationAgg,
      costAgg,
      uniqueContacts,
    ] = await Promise.all([
      prisma.call.count({ where }),
      prisma.call.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.call.count({ where: { ...where, status: 'FAILED' } }),
      prisma.call.count({ where: { ...where, status: 'NO_ANSWER' } }),
      prisma.call.count({ where: { ...where, status: 'BUSY' } }),
      prisma.call.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { duration: true },
        _sum: { duration: true },
      }),
      prisma.call.aggregate({
        where,
        _sum: { cost: true },
      }),
      prisma.call.findMany({
        where,
        select: { contactId: true },
        distinct: ['contactId'],
      }),
    ])

    const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0
    const costPerSuccess = completedCalls > 0
      ? Math.round(((costAgg._sum.cost ?? 0) / completedCalls) * 100) / 100
      : 0

    return NextResponse.json({
      totalCalls,
      completedCalls,
      failedCalls,
      noAnswerCalls,
      busyCalls,
      successRate,
      avgDuration: Math.round(durationAgg._avg.duration ?? 0),
      totalDuration: durationAgg._sum.duration ?? 0,
      totalCost: Math.round((costAgg._sum.cost ?? 0) * 100) / 100,
      costPerSuccess,
      contactsReached: uniqueContacts.length,
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics overview' }, { status: 500 })
  }
}
