import { NextResponse } from 'next/server'
import { getStats } from '@/lib/services/analytics-service'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'private, max-age=10' },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
