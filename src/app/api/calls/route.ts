import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = {
      ...(campaignId ? { campaignId } : {}),
      ...(status ? { status: status as 'INITIATED' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER' | 'BUSY' | 'CANCELLED' } : {}),
      ...(agentId ? { agentId } : {}),
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: { select: { name: true, phoneNumber: true } },
          agent: { select: { name: true } },
          campaign: { select: { name: true } },
        },
      }),
      prisma.call.count({ where }),
    ])

    return NextResponse.json({ calls, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Calls GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
