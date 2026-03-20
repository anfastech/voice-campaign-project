import { NextRequest, NextResponse } from 'next/server'
import { getCostBreakdown } from '@/lib/services/analytics-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const groupBy = searchParams.get('groupBy') as 'provider' | 'campaign' | 'day' | null
    if (!groupBy || !['provider', 'campaign', 'day'].includes(groupBy)) {
      return NextResponse.json({ error: 'groupBy must be one of: provider, campaign, day' }, { status: 400 })
    }
    const result = await getCostBreakdown({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      groupBy,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Cost breakdown error:', error)
    return NextResponse.json({ error: 'Failed to fetch cost breakdown' }, { status: 500 })
  }
}
