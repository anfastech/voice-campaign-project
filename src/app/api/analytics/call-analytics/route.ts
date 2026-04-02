import { NextRequest, NextResponse } from 'next/server'
import { getCallAnalytics } from '@/lib/services/analytics-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(req.url)
    const result = await getCallAnalytics({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      provider: searchParams.get('provider') || undefined,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Call analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch call analytics' }, { status: 500 })
  }
}
