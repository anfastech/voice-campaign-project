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

    const statusBreakdown = await prisma.call.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    })

    const outcomes = statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
    }))

    return NextResponse.json(outcomes)
  } catch (error) {
    console.error('Call outcomes error:', error)
    return NextResponse.json({ error: 'Failed to fetch call outcomes' }, { status: 500 })
  }
}
