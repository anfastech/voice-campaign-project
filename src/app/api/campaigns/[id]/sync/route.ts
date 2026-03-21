import { NextRequest, NextResponse } from 'next/server'
import { syncCampaignCalls } from '@/lib/services/campaign-sync-service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await syncCampaignCalls(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Campaign sync error:', error)
    return NextResponse.json({ error: 'Failed to sync campaign' }, { status: 500 })
  }
}
