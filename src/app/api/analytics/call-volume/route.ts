import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const mode = searchParams.get('mode') || 'daily' // daily | heatmap

    const dateFilter: Record<string, unknown> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    const where: Record<string, unknown> = {}
    if (from || to) where.startedAt = dateFilter

    const calls = await prisma.call.findMany({
      where,
      select: { startedAt: true, status: true },
      orderBy: { startedAt: 'asc' },
    })

    if (mode === 'heatmap') {
      // Hour-of-day × day-of-week heatmap
      const heatmap: Record<string, number> = {}
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          heatmap[`${d}-${h}`] = 0
        }
      }

      for (const call of calls) {
        const date = new Date(call.startedAt)
        const key = `${date.getDay()}-${date.getHours()}`
        heatmap[key]++
      }

      const data = Object.entries(heatmap).map(([key, count]) => {
        const [d, h] = key.split('-').map(Number)
        return { day: days[d], dayIndex: d, hour: h, count }
      })

      return NextResponse.json({ mode: 'heatmap', data })
    }

    // Daily volume with success/fail breakdown
    const daily: Record<string, { date: string; successful: number; failed: number; noAnswer: number; total: number }> = {}

    for (const call of calls) {
      const dateKey = new Date(call.startedAt).toISOString().slice(0, 10)
      if (!daily[dateKey]) {
        daily[dateKey] = { date: dateKey, successful: 0, failed: 0, noAnswer: 0, total: 0 }
      }
      daily[dateKey].total++
      if (call.status === 'COMPLETED') daily[dateKey].successful++
      else if (call.status === 'FAILED') daily[dateKey].failed++
      else if (call.status === 'NO_ANSWER') daily[dateKey].noAnswer++
    }

    return NextResponse.json({
      mode: 'daily',
      data: Object.values(daily),
    })
  } catch (error) {
    console.error('Call volume error:', error)
    return NextResponse.json({ error: 'Failed to fetch call volume' }, { status: 500 })
  }
}
