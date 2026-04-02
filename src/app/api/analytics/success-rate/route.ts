import { NextResponse } from 'next/server'
import { getSuccessRateByProvider } from '@/lib/services/analytics-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const result = await getSuccessRateByProvider()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Success rate error:', error)
    return NextResponse.json({ error: 'Failed to fetch success rates' }, { status: 500 })
  }
}
