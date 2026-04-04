import { NextRequest, NextResponse } from 'next/server'
import { processScheduledCampaigns } from '@/lib/services/scheduled-campaign-service'

export async function GET(req: NextRequest) {
  // Allow Vercel cron (sends CRON_SECRET) or skip auth if no secret configured
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await processScheduledCampaigns()
  return NextResponse.json(result)
}
