import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/lib/services/analytics-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const period = request.nextUrl.searchParams.get('period') || '7d'
    const stats = await getStats(period)
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'private, max-age=10' },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
