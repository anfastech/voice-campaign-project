import { NextResponse } from 'next/server'
import { getSuccessRateByProvider } from '@/lib/services/analytics-service'

export async function GET() {
  try {
    const result = await getSuccessRateByProvider()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Success rate error:', error)
    return NextResponse.json({ error: 'Failed to fetch success rates' }, { status: 500 })
  }
}
