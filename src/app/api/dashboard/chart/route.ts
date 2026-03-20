import { NextResponse } from 'next/server'
import { getChartData } from '@/lib/services/analytics-service'

export async function GET() {
  try {
    const chartData = await getChartData()
    return NextResponse.json(chartData, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    })
  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
