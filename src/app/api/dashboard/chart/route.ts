import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const grouped = await prisma.call.groupBy({
      by: ['status'],
      where: { startedAt: { gte: sevenDaysAgo } },
      _count: true,
      _min: { startedAt: true },
    })

    const perDay = await prisma.call.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
      select: { startedAt: true, status: true },
    })

    const dayMap = new Map<string, { total: number; successful: number; failed: number }>()

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      dayMap.set(key, { total: 0, successful: 0, failed: 0 })
    }

    for (const call of perDay) {
      const key = call.startedAt.toISOString().slice(0, 10)
      const bucket = dayMap.get(key)
      if (!bucket) continue
      bucket.total++
      if (call.status === 'COMPLETED') bucket.successful++
      if (['FAILED', 'NO_ANSWER', 'BUSY'].includes(call.status)) bucket.failed++
    }

    const chartData = Array.from(dayMap.entries()).map(([iso, counts]) => ({
      date: new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...counts,
    }))

    return NextResponse.json(chartData, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    })
  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
