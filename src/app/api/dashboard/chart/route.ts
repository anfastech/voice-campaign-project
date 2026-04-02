import { NextRequest, NextResponse } from 'next/server'
import { getChartData } from '@/lib/services/analytics-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const period = request.nextUrl.searchParams.get('period') || '7d'
    const chartData = await getChartData(period)
    return NextResponse.json(chartData, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    })
  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
