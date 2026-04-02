import { NextRequest, NextResponse } from 'next/server'
import { getCampaignPerformance } from '@/lib/services/analytics-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const campaignId = new URL(req.url).searchParams.get('campaignId')
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }
    const performance = await getCampaignPerformance(campaignId)
    if (!performance) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    return NextResponse.json(performance)
  } catch (error) {
    console.error('Campaign performance error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign performance' }, { status: 500 })
  }
}
